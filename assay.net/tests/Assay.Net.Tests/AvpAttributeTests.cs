using System.Reflection;
using Assay.Net;

namespace Assay.Net.Tests;

public class AvpAttributeTests
{
    // Private on purpose: it is a reflection fixture, not a test (xUnit1013).
    [AVP("own-resource-only")]
    private static void SampleVerification() { }

    [AVP(typeof(ProtectedResource), "own-resource-only")]
    private static void SubjectBoundVerification() { }

    [Fact]
    public void avp_attribute_carries_the_criterion_id()
    {
        var method = typeof(AvpAttributeTests).GetMethod(nameof(SampleVerification), BindingFlags.NonPublic | BindingFlags.Static)!;
        var attr = method.GetCustomAttribute<AVPAttribute>();
        Assert.NotNull(attr);
        Assert.Equal("own-resource-only", attr!.CriterionId);
        Assert.Null(attr.SubjectType);
    }

    [Fact]
    public void avp_attribute_binds_the_proof_to_its_subject()
    {
        var method = typeof(AvpAttributeTests).GetMethod(
            nameof(SubjectBoundVerification), BindingFlags.NonPublic | BindingFlags.Static)!;
        var attr = method.GetCustomAttribute<AVPAttribute>();

        Assert.NotNull(attr);
        Assert.Equal(typeof(ProtectedResource), attr!.SubjectType);
        Assert.Equal("own-resource-only", attr.CriterionId);
    }

    private sealed class ProtectedResource;
}
