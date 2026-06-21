using System.Reflection;
using Assay.Net;

namespace Assay.Net.Tests;

public class AvpAttributeTests
{
    [AVP("own-resource-only")]
    public static void SampleVerification() { }

    [Fact]
    public void avp_attribute_carries_the_criterion_id()
    {
        var method = typeof(AvpAttributeTests).GetMethod(nameof(SampleVerification))!;
        var attr = method.GetCustomAttribute<AVPAttribute>();
        Assert.NotNull(attr);
        Assert.Equal("own-resource-only", attr!.CriterionId);
    }
}
