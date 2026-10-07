defmodule Assay.AccessControl do
  @moduledoc "access-control — a protected endpoint refuses an unauthenticated request; it is never silently served."
  @behaviour Assay
  alias Assay.Http

  defmodule Subject do
    @enforce_keys [:protected_path]
    defstruct [:base_url, :protected_path, method: :get]
  end

  @impl true
  def name, do: "access-control"

  @impl true
  def oracles do
    %{
      "requires-authentication" => fn s ->
        s.base_url |> Http.request(s.method, s.protected_path) |> Http.refused!("unauthenticated #{s.method} #{s.protected_path}")
      end
    }
  end
end
