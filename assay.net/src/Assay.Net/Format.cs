using System.Text;

namespace Assay.Net;

/// <summary>Human/agent-readable rendering of verdicts — the .NET sibling of the TS formatVerdict.</summary>
public static class Format
{
    /// <summary>One-block summary: header with the score, one line per criterion (reason on fail/skip).</summary>
    public static string Verdict(Verdict v)
    {
        var pct = (int)Math.Round(v.AcceptanceScore * 100);
        var sb = new StringBuilder();
        sb.Append("assay · ").Append(v.Subject).Append(" · ").Append(v.Archetype)
          .Append(" — acceptance ").Append(pct).Append('%')
          .AppendLine(v.Applicable == 0 ? " (0 applicable — nothing was decided)" : $" ({v.Passed}/{v.Applicable})");
        foreach (var r in v.Results)
        {
            var mark = r.Status switch
            {
                VerdictStatus.Pass => "✓",
                VerdictStatus.Fail => "✗",
                _ => "–",
            };
            sb.Append("  ").Append(mark).Append(' ').Append(r.CriterionId)
              .Append(" [").Append(r.Status.ToString().ToLowerInvariant()).Append(']');
            if (r.Status != VerdictStatus.Pass) sb.Append(" — ").Append(r.Reason);
            sb.AppendLine();
        }
        return sb.ToString().TrimEnd();
    }
}
