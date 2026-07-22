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
            new CriterionVerdict("gate-enforced-on-body-target", VerdictStatus.Unresolved, "no oracle"),
        ]);
        var b = new Verdict("s", "submission-gate",
        [
            new CriterionVerdict("gate-enforced-on-submission", VerdictStatus.Unresolved, "no oracle"),
            new CriterionVerdict("gate-enforced-on-body-target", VerdictStatus.Pass, "ok"),
        ]);

        var merged = Verdict.Merge(a, b);
        Assert.Equal(2, merged.Applicable);
        Assert.Equal(2, merged.Passed);
        Assert.Equal(VerdictOutcome.Pass, merged.Outcome);
        Assert.Equal(1.0, merged.AcceptanceScore);

        var conflict = new Verdict("s", "submission-gate",
            [new CriterionVerdict("gate-enforced-on-submission", VerdictStatus.Fail, "no")]);
        Assert.Throws<InvalidOperationException>(() => Verdict.Merge(a, conflict));
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
        Assert.Equal([new SpecObligation("S", "yes")], manifest.DeclaredObligations);
    }

    [Fact]
    public void format_renders_score_and_reasons_for_non_passes()
    {
        var v = new Verdict("subject-x", "authorization",
        [
            new CriterionVerdict("own-resource-only", VerdictStatus.Pass, "held"),
            new CriterionVerdict("role-required", VerdictStatus.Fail, "let it through"),
            new CriterionVerdict("server-is-authoritative", VerdictStatus.NotApplicable, "no seam"),
        ]);
        var text = Format.Verdict(v);
        Assert.Contains("subject-x · authorization — fail · acceptance 50% (1/2; unresolved=0)", text);
        Assert.Contains("✗ role-required [fail] — let it through", text);
        Assert.Contains("– server-is-authoritative [not-applicable] — no seam", text);
    }

    [Fact]
    public void an_empty_or_unresolved_verdict_is_inconclusive_and_cannot_be_accepted()
    {
        var empty = new Verdict("s", "authorization",
            [new CriterionVerdict("own-resource-only", VerdictStatus.NotApplicable, "wrong shape")]);
        var unresolved = new Verdict("s", "authorization",
            [
                new CriterionVerdict("own-resource-only", VerdictStatus.Pass, "held"),
                new CriterionVerdict("role-required", VerdictStatus.Unresolved, "oracle unavailable"),
            ]);

        Assert.Equal(VerdictOutcome.Inconclusive, empty.Outcome);
        Assert.Null(empty.AcceptanceScore);
        Assert.Throws<AvpGateException>(() => empty.RequireAccepted());
        Assert.Equal(VerdictOutcome.Inconclusive, unresolved.Outcome);
        Assert.Equal(1.0, unresolved.AcceptanceScore);
        Assert.Throws<AvpGateException>(() => unresolved.RequireAccepted());

        var failed = new Verdict("s", "authorization",
            [new CriterionVerdict("own-resource-only", VerdictStatus.Fail, "escaped")]);
        Assert.Throws<AvpGateException>(() => failed.RequireAccepted());
    }

    [Fact]
    public async Task runner_stamps_the_catalog_and_archetype_versions()
    {
        var verdict = await Runner.Run(TestCatalog.Load(), new Throwing(), "s", new NoSubject());

        Assert.Equal("0.4.0", verdict.ProtocolVersion);
        Assert.NotEqual("unknown", verdict.ArchetypeVersion);
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
