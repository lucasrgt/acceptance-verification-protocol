defmodule Assay.LifecycleGate do
  @moduledoc "lifecycle-gate — the server enforces a transition's precondition; hiding the action in the interface is only a courtesy."
  @behaviour Assay
  alias Assay.Http

  defmodule Subject do
    @enforce_keys [:ready_transition_path, :unmet_transition_path]
    defstruct [:base_url, :ready_transition_path, :unmet_transition_path, :bearer, :body, method: :post]
  end

  @impl true
  def name, do: "lifecycle-gate"

  @impl true
  def oracles do
    %{
      "gate-enforced-server-side" => fn s ->
        opts = [bearer: s.bearer] ++ if(s.body, do: [json: s.body], else: [])

        s.base_url
        |> Http.request(s.method, s.ready_transition_path, opts)
        |> Http.accepted!("transition on a resource whose precondition is met (ready)")

        s.base_url
        |> Http.request(s.method, s.unmet_transition_path, opts)
        |> Http.rejected!("transition on a resource whose precondition is unmet — the server must refuse it (4xx), not trust the interface gate")
      end
    }
  end
end
