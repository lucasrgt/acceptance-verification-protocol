defmodule Assay.CriterionVerdict do
  @moduledoc "Per-criterion outcome: status, an actionable reason and optional evidence."
  defstruct [:criterion_id, :status, :reason, :evidence, :duration_ms]

  @statuses %{pass: "pass", fail: "fail", not_applicable: "not-applicable", unresolved: "unresolved"}

  def to_map(%__MODULE__{} = v) do
    %{"criterionId" => v.criterion_id, "status" => @statuses[v.status], "reason" => v.reason}
    |> put("evidence", v.evidence)
    |> put("durationMs", v.duration_ms)
  end

  defp put(map, _key, nil), do: map
  defp put(map, key, value), do: Map.put(map, key, value)
end

defmodule Assay.Verdict do
  @moduledoc "The aggregate verdict for a subject against one archetype."
  defstruct [:subject, :archetype, :archetype_version, :protocol_version, results: [], duration_ms: 0]

  def applicable(%__MODULE__{results: results}), do: Enum.count(results, &(&1.status in [:pass, :fail]))
  def passed(%__MODULE__{results: results}), do: Enum.count(results, &(&1.status == :pass))
  def unresolved(%__MODULE__{results: results}), do: Enum.count(results, &(&1.status == :unresolved))

  def outcome(%__MODULE__{results: results} = v) do
    cond do
      Enum.any?(results, &(&1.status == :fail)) -> :fail
      applicable(v) == 0 or unresolved(v) > 0 -> :inconclusive
      true -> :pass
    end
  end

  def acceptance_score(v), do: if(applicable(v) == 0, do: nil, else: passed(v) / applicable(v))

  @doc "Raises `Assay.GateError` unless every applicable criterion passed and none is unresolved."
  def require_accepted!(v) do
    case outcome(v) do
      :pass -> v
      :inconclusive -> raise Assay.GateError, "Verification is inconclusive: applicable=#{applicable(v)}, unresolved=#{unresolved(v)}. No green verdict was produced."
      :fail -> raise Assay.GateError, "Verification failed: #{Enum.count(v.results, &(&1.status == :fail))} mandatory criterion/criteria failed."
    end
  end

  def to_map(%__MODULE__{} = v) do
    %{
      "subject" => v.subject,
      "archetype" => v.archetype,
      "archetypeVersion" => v.archetype_version,
      "protocolVersion" => v.protocol_version,
      "results" => Enum.map(v.results, &Assay.CriterionVerdict.to_map/1),
      "outcome" => to_string(outcome(v)),
      "acceptanceScore" => acceptance_score(v),
      "durationMs" => v.duration_ms
    }
  end
end
