using System.Reflection;
using Assay.Net;

namespace Assay.Net.Tests;

public class AvpAttributeTests
{
    // Private on purpose: it is a reflection fixture, not a test (xUnit1013).
    [AVP("own-resource-only")]
    private static void SampleVerification() { }

    [Fact]
    public void avp_attribute_carries_the_criterion_id()
    {
        var method = typeof(AvpAttributeTests).GetMethod(nameof(SampleVerification), BindingFlags.NonPublic | BindingFlags.Static)!;
        var attr = method.GetCustomAttribute<AVPAttribute>();
        Assert.NotNull(attr);
        Assert.Equal("own-resource-only", attr!.CriterionId);
    }
}
