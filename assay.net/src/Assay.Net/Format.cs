using System.Text;

namespace Assay.Net;

/// <summary>Human/agent-readable rendering of verdicts — the .NET sibling of the TS formatVerdict.</summary>
public static class Format
{
    /// <summary>One-block summary: outcome + score, then one line per criterion.</summary>
    public static string Verdict(Verdict v)
    {
        var score = v.AcceptanceScore is null
            ? "n/a"
            : $"{(int)Math.Round(v.AcceptanceScore.Value * 100)}%";
        var sb = new StringBuilder();
        sb.Append("assay · ").Append(v.Subject).Append(" · ").Append(v.Archetype)
          .Append(" — ").Append(v.Outcome.ToString().ToLowerInvariant())
          .Append(" · acceptance ").Append(score)
          .AppendLine(v.Applicable == 0
              ? " (0 applicable — nothing was decided)"
              : $" ({v.Passed}/{v.Applicable}; unresolved={v.Unresolved})");
        foreach (var r in v.Results)
        {
            var mark = r.Status switch
            {
                VerdictStatus.Pass => "✓",
                VerdictStatus.Fail => "✗",
                VerdictStatus.Unresolved => "?",
                _ => "–",
            };
            sb.Append("  ").Append(mark).Append(' ').Append(r.CriterionId)
              .Append(" [").Append(StatusName(r.Status)).Append(']');
            if (r.Status != VerdictStatus.Pass) sb.Append(" — ").Append(r.Reason);
            sb.AppendLine();
        }
        return sb.ToString().TrimEnd();
    }

    private static string StatusName(VerdictStatus status) => status switch
    {
        VerdictStatus.NotApplicable => "not-applicable",
        _ => status.ToString().ToLowerInvariant(),
    };
}
