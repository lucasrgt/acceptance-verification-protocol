using Assay.Net;

namespace Assay.Net.Tests;

/// <summary>
/// The avp side of the bridge reads the SAME <c>&lt;Module&gt;.spec.toml</c> the static doctor enforces: it parses
/// the module's declared slice→criteria so a run can be scored against what the module promises to hold.
/// </summary>
public class SpecManifestTests
{
    private const string Sample = """
        # Account — acceptance manifest (the Clockwork beacon).
        module = "Account"

        [slices.Login]
        criteria = ["rejects-invalid-credentials", "issues-token-on-valid"]

        [slices.Refresh]
        criteria = ["rotates-on-refresh", "replay-burns-family"]

        [slices.Register]
        criteria = ["rejects-duplicate"]
        """;

    [Fact]
    public void parses_module_and_each_slice_with_its_criteria()
    {
        var m = SpecManifest.Parse(Sample);

        Assert.Equal("Account", m.Module);
        Assert.Equal(3, m.Slices.Count);
        Assert.Equal(new[] { "rejects-invalid-credentials", "issues-token-on-valid" }, m.Slices["Login"]);
        Assert.Equal(new[] { "rotates-on-refresh", "replay-burns-family" }, m.Slices["Refresh"]);
        Assert.Equal(new[] { "rejects-duplicate" }, m.Slices["Register"]);
    }

    [Fact]
    public void declared_obligations_preserve_every_subject_criterion_pair()
    {
        var m = SpecManifest.Parse(Sample);

        Assert.Contains(new SpecObligation("Login", "rejects-invalid-credentials"), m.DeclaredObligations);
        Assert.Contains(new SpecObligation("Register", "rejects-duplicate"), m.DeclaredObligations);
        Assert.Equal(5, m.DeclaredObligations.Count);
    }

    [Fact]
    public void a_manifest_without_a_module_key_is_a_format_error()
    {
        Assert.Throws<FormatException>(() => SpecManifest.Parse("[slices.X]\ncriteria = [\"a\"]"));
    }

    [Fact]
    public void a_manifest_without_slices_is_a_format_error()
    {
        Assert.Throws<FormatException>(() => SpecManifest.Parse("module = \"Empty\""));
    }

    [Fact]
    public void obligations_preserve_the_subject_when_criteria_are_shared()
    {
        var manifest = SpecManifest.Parse("""
            module = "Files"
            [slices.Upload]
            criteria = ["requires-authentication"]
            [slices.Delete]
            criteria = ["requires-authentication"]
            """);
        var uploadVerdict = new Verdict(
            "upload",
            "authorization",
            [new CriterionVerdict("requires-authentication", VerdictStatus.Pass, "held")]);

        var missing = manifest.UnsatisfiedObligationsFrom([uploadVerdict]);

        Assert.Equal([new SpecObligation("Delete", "requires-authentication")], missing);
    }

    [Fact]
    public void a_failed_verdict_does_not_satisfy_an_obligation()
    {
        var manifest = SpecManifest.Parse("""
            module = "Files"
            [slices.Upload]
            criteria = ["requires-authentication"]
            """);
        var failed = new Verdict("Upload", "access-control",
            [new CriterionVerdict("requires-authentication", VerdictStatus.Fail, "public")]);

        Assert.Equal(manifest.DeclaredObligations, manifest.UnsatisfiedObligationsFrom([failed]));
    }

    [Theory]
    [InlineData("[slices.X]\ncriteria = []")]
    [InlineData("[slices.X]\ncriteria = [\"a\", \"a\"]")]
    [InlineData("[slices.X]\ncriteria = [\"a\"]\n[slices.X]\ncriteria = [\"a\"]")]
    public void empty_duplicate_or_redeclared_slice_obligations_are_rejected(string slices)
    {
        Assert.Throws<FormatException>(() => SpecManifest.Parse($"module = \"M\"\n{slices}"));
    }
}
