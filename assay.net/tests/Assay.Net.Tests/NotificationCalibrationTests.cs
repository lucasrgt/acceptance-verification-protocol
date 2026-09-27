using Assay.Net.Archetypes;
using System.Text.Json;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;

namespace Assay.Net.Tests;

public sealed class NotificationCalibrationTests
{
    private static Task<Verdict> Verify(NotifySubject subject) =>
        Runner.Run(TestCatalog.Load(), new SecondOrderEffects(), "notification-calibration", subject);

    private static VerdictStatus Status(Verdict verdict) =>
        verdict.Results.Single(result => result.CriterionId == "notifies-all-parties").Status;

    [Fact]
    public async Task old_messages_do_not_prove_a_new_notification()
    {
        await using var app = await Repro.Start(app =>
        {
            app.MapPost("/transition", () => Results.Ok());
            app.MapGet("/host", () => Results.Ok(new[] { "old host message" }));
            app.MapGet("/guest", () => Results.Ok(new[] { "old guest message" }));
        });
        var verdict = await Runner.Run(TestCatalog.Load(), new SecondOrderEffects(), "stale-inboxes",
            new NotifySubject(app.BaseUrl(), "/transition", ["/host", "/guest"]));
        Assert.Equal(VerdictStatus.Fail,
            verdict.Results.Single(result => result.CriterionId == "notifies-all-parties").Status);
    }

    [Theory]
    [InlineData(false, false)]
    [InlineData(true, false)]
    [InlineData(false, true)]
    [InlineData(true, true)]
    public async Task sends_real_credentials_and_payload_and_observes_growth_for_every_party(bool omitBody, bool missGuest)
    {
        var host = new List<object> { new { id = "old-host" } };
        var guest = new List<object> { new { id = "old-guest" } };
        var events = new List<string>();
        await using var app = await Repro.Start(app =>
        {
            app.MapGet("/host", (HttpRequest request) =>
            {
                if (Repro.Bearer(request) != "host-token") return Results.Unauthorized();
                events.Add("host");
                return Results.Ok(new { notifications = host });
            });
            app.MapGet("/guest", (HttpRequest request) =>
            {
                if (Repro.Bearer(request) != "guest-token") return Results.Unauthorized();
                events.Add("guest");
                return Results.Ok(new { notifications = guest });
            });
            app.MapPost("/transition", async (HttpRequest request) =>
            {
                if (Repro.Bearer(request) != "actor-token") return Results.Unauthorized();
                var body = await Repro.Body(request);
                if (omitBody ? body.Length != 0 : JsonDocument.Parse(body).RootElement.GetProperty("reason").GetString() != "cancel")
                    return Results.BadRequest();
                events.Add("trigger");
                host.Add(new { id = "new-host" });
                if (!missGuest) guest.Add(new { id = "new-guest" });
                return Results.NoContent();
            });
        });
        var verdict = await Verify(new NotifySubject(app.BaseUrl(), "/transition", ["/host", "/guest"])
        {
            TriggerToken = "actor-token",
            TriggerBody = omitBody ? null : new { reason = "cancel" },
            PartyInboxTokens = ["host-token", "guest-token"],
            InboxItemsField = "notifications",
        });
        Assert.Equal(missGuest ? VerdictStatus.Fail : VerdictStatus.Pass, Status(verdict));
        Assert.Equal(new[] { "host", "guest", "trigger", "host", "guest" }, events);
    }

    [Theory]
    [InlineData("empty-inboxes")]
    [InlineData("mismatched-tokens")]
    public async Task invalid_party_configuration_fails_before_any_request(string variant)
    {
        var requests = 0;
        await using var app = await Repro.Start(app => app.Run(_ =>
        {
            requests++;
            return Task.CompletedTask;
        }));
        var subject = new NotifySubject(app.BaseUrl(), "/transition", variant == "empty-inboxes" ? [] : ["/host"])
        {
            PartyInboxTokens = variant == "mismatched-tokens" ? [] : null,
        };
        Assert.Equal(VerdictStatus.Fail, Status(await Verify(subject)));
        Assert.Equal(0, requests);
    }

    [Theory]
    [InlineData("read-refused")]
    [InlineData("trigger-refused")]
    [InlineData("after-read-refused")]
    [InlineData("invalid-json")]
    [InlineData("null-json")]
    [InlineData("missing-field")]
    [InlineData("non-array")]
    [InlineData("shrinking")]
    public async Task missing_or_invalid_evidence_never_passes(string variant)
    {
        var triggered = false;
        await using var app = await Repro.Start(app =>
        {
            app.MapPost("/transition", () =>
            {
                triggered = true;
                return variant == "trigger-refused" ? Results.Unauthorized() : Results.Ok();
            });
            app.MapGet("/inbox", () =>
            {
                if (variant == "read-refused" || (variant == "after-read-refused" && triggered)) return Results.Unauthorized();
                if (variant == "invalid-json") return Results.Text("broken", "application/json");
                if (variant == "null-json") return Results.Text("null", "application/json");
                if (variant == "missing-field") return Results.Ok(new { other = Array.Empty<string>() });
                if (variant == "non-array") return Results.Ok(new { notifications = "not an array" });
                return Results.Ok(triggered && variant == "shrinking" ? Array.Empty<string>() : new[] { "old" });
            });
        });
        var verdict = await Verify(new NotifySubject(app.BaseUrl(), "/transition", ["/inbox"])
        {
            InboxItemsField = variant is "missing-field" or "non-array" ? "notifications" : null,
        });
        Assert.Equal(VerdictStatus.Fail, Status(verdict));
        Assert.Equal(variant is "trigger-refused" or "after-read-refused" or "shrinking", triggered);
    }
}
