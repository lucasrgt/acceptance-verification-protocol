using Assay.Net;

namespace Assay.Net.Tests;

/// <summary>The core surfaces added for protocol parity: merge, gap check, format, catch-all runner, design catalog.</summary>
public class CoreSurfaceTests
{
    private sealed record NoSubject;

    private sealed class Throwing : Archetype<NoSubject>
    {
        public override string Name => "authorization";

        public override IReadOnlyDictionary<string, Func<NoSubject, Task>> Oracles { get; } =
            new Dictionary<string, Func<NoSubject, Task>>
            {
                ["own-resource-only"] = _ => throw new InvalidOperationException("boom — not an AvpFail"),
            };
    }

    [Fact]
    public async Task an_unexpected_exception_is_a_FAIL_with_evidence_never_an_aborted_run()
    {
        var verdict = await Runner.Run(TestCatalog.Load(), new Throwing(), "s", new NoSubject());
        var r = verdict.Results.Single(x => x.CriterionId == "own-resource-only");
        Assert.Equal(VerdictStatus.Fail, r.Status);
        Assert.Contains("Unexpected error", r.Reason);
        Assert.NotNull(r.Evidence);
    }

    [Fact]
    public void merge_prefers_decided_results_and_rejects_conflicts()
    {
        var a = new Verdict("s", "submission-gate",
        [
            new CriterionVerdict("gate-enforced-on-submission", VerdictStatus.Pass, "ok"),
            new CriterionVerdict("gate-enforced-on-body-target", VerdictStatus.Skipped, "no oracle"),
        ]);
        var b = new Verdict("s", "submission-gate",
        [
            new CriterionVerdict("gate-enforced-on-submission", VerdictStatus.Skipped, "no oracle"),
            new CriterionVerdict("gate-enforced-on-body-target", VerdictStatus.Pass, "ok"),
        ]);

        var merged = Verdict.Merge(a, b);
        Assert.Equal(2, merged.Applicable);
        Assert.Equal(2, merged.Passed);
        Assert.Equal(1.0, merged.AcceptanceScore);

        var conflict = new Verdict("s", "submission-gate",
            [new CriterionVerdict("gate-enforced-on-submission", VerdictStatus.Fail, "no")]);
        Assert.Throws<InvalidOperationException>(() => Verdict.Merge(a, conflict));
    }

    [Fact]
    public void missing_from_reports_declared_criteria_without_a_decided_verdict()
    {
        var manifest = SpecManifest.Parse("""
            module = "Quotes"
            [slices.Submit]
            criteria = ["gate-enforced-on-submission", "own-resource-only"]
            """);
        var verdicts = new[]
        {
            new Verdict("s", "submission-gate",
                [new CriterionVerdict("gate-enforced-on-submission", VerdictStatus.Pass, "ok")]),
        };
        Assert.Equal(["own-resource-only"], manifest.MissingFrom(verdicts));
    }

    [Fact]
    public void parser_matches_exact_keys_only()
    {
        var manifest = SpecManifest.Parse("""
            module_name = "Wrong"
            module = "Right"
            [slices.S]
            criteria_extra = ["nope"]
            criteria = ["yes"]
            """);
        Assert.Equal("Right", manifest.Module);
        Assert.Equal(["yes"], manifest.DeclaredCriteria);
    }

    [Fact]
    public void format_renders_score_and_reasons_for_non_passes()
    {
        var v = new Verdict("subject-x", "authorization",
        [
            new CriterionVerdict("own-resource-only", VerdictStatus.Pass, "held"),
            new CriterionVerdict("role-required", VerdictStatus.Fail, "let it through"),
            new CriterionVerdict("server-is-authoritative", VerdictStatus.Skipped, "no seam"),
        ]);
        var text = Format.Verdict(v);
        Assert.Contains("subject-x · authorization — acceptance 50% (1/2)", text);
        Assert.Contains("✗ role-required [fail] — let it through", text);
        Assert.Contains("– server-is-authoritative [skipped] — no seam", text);
    }

    [Fact]
    public void design_catalog_is_embedded_and_loadable()
    {
        var design = Catalog.LoadDesignDefault();
        Assert.Equal("AVP", design.Protocol);
        Assert.Contains(design.Archetypes, a => a.Archetype == "token-adherence");
    }

    [Fact]
    public void catalog_carries_requires_and_descriptions()
    {
        var catalog = Catalog.LoadDefault();
        var auth = catalog.Archetypes.Single(a => a.Archetype == "authorization");
        Assert.False(string.IsNullOrWhiteSpace(auth.Description));
        Assert.Contains(auth.Criteria, c => c.Requires is not null);
    }
}
