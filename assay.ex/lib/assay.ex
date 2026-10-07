defmodule Assay do
  @moduledoc """
  Elixir reference implementation of AVP for the `http` substrate.

  An archetype binds the catalog's criteria (`priv/catalog.json`, the same
  bytes as `protocol/catalog.json`) to mechanical oracles. `run/4` loops the
  catalog criteria, runs each bound oracle against the subject and returns an
  `Assay.Verdict`. An oracle fails with `Assay.Fail`; `Assay.NotApplicable`
  and `Assay.Unresolved` keep irrelevance and inability to decide distinct; an
  unexpected exception is still a `fail`. A criterion with no oracle is
  `unresolved`, so an empty run is never green.
  """

  alias Assay.{Catalog, CriterionVerdict, Verdict}

  @callback name() :: String.t()
  @callback oracles() :: %{String.t() => (struct() -> any())}

  defmodule Fail do
    defexception [:message, :evidence]
  end

  defmodule NotApplicable do
    defexception [:message]
  end

  defmodule Unresolved do
    defexception [:message]
  end

  defmodule GateError do
    defexception [:message]
  end

  @doc """
  Verifies `subject` against `archetype`. Options: `catalog:` (defaults to the
  bundled one), `transport:` (an `Assay.Http` transport the oracles use instead
  of a real socket), `on_criterion:` (called with each verdict as it lands).
  """
  def run(archetype, subject_name, subject, opts \\ []) do
    catalog = Keyword.get_lazy(opts, :catalog, &Catalog.bundled/0)
    spec = Catalog.archetype!(catalog, archetype.name())
    oracles = archetype.oracles()
    started = System.monotonic_time(:millisecond)

    results =
      Assay.Http.with_transport(opts[:transport], fn ->
        for criterion <- spec["criteria"] do
          verdict = decide(criterion, oracles[criterion["id"]], subject)
          if callback = opts[:on_criterion], do: callback.(verdict)
          verdict
        end
      end)

    %Verdict{
      subject: subject_name,
      archetype: archetype.name(),
      archetype_version: spec["version"],
      protocol_version: catalog["protocolVersion"],
      results: results,
      duration_ms: System.monotonic_time(:millisecond) - started
    }
  end

  defp decide(%{"id" => id, "oracle" => "mechanical", "statement" => statement}, oracle, subject) when is_function(oracle, 1) do
    started = System.monotonic_time(:millisecond)
    elapsed = fn -> System.monotonic_time(:millisecond) - started end

    try do
      oracle.(subject)
      %CriterionVerdict{criterion_id: id, status: :pass, reason: statement, duration_ms: elapsed.()}
    rescue
      e in NotApplicable -> %CriterionVerdict{criterion_id: id, status: :not_applicable, reason: e.message, duration_ms: elapsed.()}
      e in Unresolved -> %CriterionVerdict{criterion_id: id, status: :unresolved, reason: e.message, duration_ms: elapsed.()}
      e in Fail -> %CriterionVerdict{criterion_id: id, status: :fail, reason: e.message, evidence: e.evidence, duration_ms: elapsed.()}
      e ->
        %CriterionVerdict{
          criterion_id: id,
          status: :fail,
          reason: "Unexpected error while verifying: #{Exception.message(e)}",
          evidence: %{error: Exception.message(e), type: inspect(e.__struct__)},
          duration_ms: elapsed.()
        }
    end
  end

  defp decide(%{"id" => id, "oracle" => "mechanical"}, _none, _subject),
    do: %CriterionVerdict{criterion_id: id, status: :unresolved, reason: "no Elixir oracle bound yet"}

  defp decide(%{"id" => id, "oracle" => oracle}, _oracle, _subject),
    do: %CriterionVerdict{criterion_id: id, status: :unresolved, reason: "oracle '#{oracle}' is not run by this adapter"}
end
