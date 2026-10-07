defmodule Assay.RequestIdempotency do
  @moduledoc "request-idempotency — a mutation carrying an idempotency key applies at most once; a different key applies again."
  @behaviour Assay
  alias Assay.Http

  defmodule Subject do
    @enforce_keys [:create_path]
    defstruct [:base_url, :create_path, :bearer, request_body: %{name: "resource"}, id_field: ["id"], header: "idempotency-key"]
  end

  @impl true
  def name, do: "request-idempotency"

  @impl true
  def oracles do
    %{
      "idempotency-key-honored" => fn s ->
        key_a = "assay-idem-#{System.unique_integer([:positive])}-#{:erlang.phash2(make_ref())}"
        key_b = "assay-idem-#{System.unique_integer([:positive])}-#{:erlang.phash2(make_ref())}"
        a = effect(s, key_a, "first call with the first key")
        replay = effect(s, key_a, "repeat call with the same key")

        if replay != a,
          do: raise(Assay.Fail, message: "the same idempotency key produced two distinct effects (#{inspect(a)} then #{inspect(replay)}) — the key must replay the original, never apply twice.")

        if effect(s, key_b, "call with a different key") == a,
          do: raise(Assay.Fail, message: "two different idempotency keys collapsed to one effect (#{inspect(a)}) — a distinct key must apply again.")
      end
    }
  end

  defp effect(s, key, what) do
    response = Http.request(s.base_url, :post, s.create_path, bearer: s.bearer, json: s.request_body, headers: [{s.header, key}])
    Http.accepted!(response, what)

    case get_in(Http.json!(response, what), s.id_field) do
      value when value not in [nil, ""] -> value
      _ -> raise Assay.Fail, message: "#{what}: response body has no #{Enum.join(s.id_field, ".")} to identify the effect."
    end
  end
end
