defmodule Assay.ResourceUniqueness do
  @moduledoc "resource-uniqueness — a second create of the same unique key is rejected, never silently duplicated."
  @behaviour Assay
  alias Assay.Http

  defmodule Subject do
    @enforce_keys [:create_path, :body]
    defstruct [:base_url, :create_path, :body, :bearer]
  end

  @impl true
  def name, do: "resource-uniqueness"

  @impl true
  def oracles do
    %{
      "rejects-duplicate" => fn s ->
        create = fn -> Http.request(s.base_url, :post, s.create_path, bearer: s.bearer, json: s.body) end
        Http.accepted!(create.(), "first create at #{s.create_path}")
        Http.rejected!(create.(), "second create of the same unique key at #{s.create_path}")
      end
    }
  end
end
