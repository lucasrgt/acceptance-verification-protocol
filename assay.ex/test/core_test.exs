defmodule Assay.CoreTest do
  use ExUnit.Case, async: true
  alias Assay.{CriterionVerdict, Verdict}

  defmodule Partial do
    @behaviour Assay
    def name, do: "authorization"

    def oracles do
      %{
        "own-resource-only" => fn _ -> raise "socket closed" end,
        "role-required" => fn _ -> raise Assay.Unresolved, message: "no admin token in this environment" end
      }
    end
  end

  test "the bundled catalog is byte-identical to the protocol's" do
    assert File.read!(Application.app_dir(:assay_ex, "priv/catalog.json")) == File.read!("../protocol/catalog.json")
  end

  test "unexpected errors fail, unbound criteria stay unresolved, and progress is reported" do
    me = self()
    verdict = Assay.run(Partial, "subject", %{}, on_criterion: &send(me, {:criterion, &1.criterion_id}))
    [own, role, server] = verdict.results
    assert %CriterionVerdict{status: :fail, reason: "Unexpected error while verifying: socket closed"} = own
    assert %CriterionVerdict{status: :unresolved, reason: "no admin token in this environment"} = role
    assert %CriterionVerdict{status: :unresolved, reason: "no Elixir oracle bound yet"} = server
    assert_received {:criterion, "server-is-authoritative"}
    assert Verdict.outcome(verdict) == :fail
    assert_raise Assay.GateError, ~r/failed/, fn -> Verdict.require_accepted!(verdict) end
  end

  test "non-mechanical oracles are unresolved and an empty run is never green" do
    catalog = %{
      "protocolVersion" => "0.4.0",
      "archetypes" => [%{"archetype" => "authorization", "version" => "1", "criteria" => [%{"id" => "x", "oracle" => "human", "statement" => "s"}]}]
    }

    verdict = Assay.run(Partial, "subject", %{}, catalog: catalog)
    assert [%CriterionVerdict{status: :unresolved, reason: "oracle 'human' is not run by this adapter"}] = verdict.results
    assert Verdict.outcome(verdict) == :inconclusive
    assert Verdict.acceptance_score(verdict) == nil
    assert_raise Assay.GateError, ~r/inconclusive/, fn -> Verdict.require_accepted!(verdict) end
    assert_raise ArgumentError, ~r/protocol drift/, fn -> Assay.Catalog.archetype!(catalog, "missing") end
  end

  test "verdicts serialize to the portable shape" do
    verdict = %Verdict{
      subject: "s",
      archetype: "a",
      archetype_version: "1",
      protocol_version: "0.4.0",
      results: [%CriterionVerdict{criterion_id: "c", status: :pass, reason: "ok"}, %CriterionVerdict{criterion_id: "d", status: :not_applicable, reason: "n/a", evidence: %{x: 1}}]
    }

    assert Verdict.require_accepted!(verdict) == verdict

    assert %{
             "outcome" => "pass",
             "acceptanceScore" => 1.0,
             "results" => [%{"criterionId" => "c", "status" => "pass"}, %{"status" => "not-applicable", "evidence" => %{x: 1}}]
           } = Verdict.to_map(verdict)
  end
end
