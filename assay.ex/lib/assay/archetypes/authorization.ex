defmodule Assay.Authorization do
  @moduledoc "authorization — the caller only touches what it owns, at the role its operation implies, and never sets a privileged field."
  @behaviour Assay
  alias Assay.Http

  defmodule Subject do
    @enforce_keys [:owner_token, :own_resource, :others_resource]
    defstruct [
      :base_url,
      :owner_token,
      :own_resource,
      :others_resource,
      :admin_path,
      :admin_token,
      :lesser_token,
      :write_path,
      :read_path,
      :token,
      :privileged_body,
      resource_method: :put,
      own_body: %{name: "ok"},
      others_body: %{name: "pwned"},
      privileged_method: :get,
      price_path: ["price"]
    ]
  end

  @impl true
  def name, do: "authorization"

  @impl true
  def oracles do
    %{
      "own-resource-only" => fn s ->
        s.base_url
        |> Http.request(s.resource_method, s.own_resource, body_opts(s.owner_token, s.own_body))
        |> Http.accepted!("owner writing its own resource")

        s.base_url
        |> Http.request(s.resource_method, s.others_resource, body_opts(s.owner_token, s.others_body))
        |> Http.refused!("caller writing another account's resource id (IDOR)")
      end,
      "role-required" => fn s ->
        unless s.admin_path, do: raise(Assay.NotApplicable, message: "role-required: this subject provides no privileged endpoint.")

        s.base_url
        |> Http.request(s.privileged_method, s.admin_path, body_opts(s.admin_token, s.privileged_body))
        |> Http.accepted!("admin calling a privileged endpoint")

        s.base_url
        |> Http.request(s.privileged_method, s.admin_path, body_opts(s.lesser_token, s.privileged_body))
        |> Http.refused!("a lesser role calling a privileged endpoint")
      end,
      "server-is-authoritative" => fn s ->
        unless s.write_path && s.read_path,
          do: raise(Assay.NotApplicable, message: "server-is-authoritative: this subject provides no write/read seam.")

        s.base_url
        |> Http.request(:post, s.write_path, bearer: s.token, json: %{item: "x", price: 1})
        |> Http.accepted!("writing an item with a tampered price")

        read = Http.request(s.base_url, :get, s.read_path, bearer: s.token)
        Http.accepted!(read, "reading the stored item back")

        case get_in(Http.json!(read, "reading the stored item back"), s.price_path) do
          nil -> raise Assay.Fail, message: "server-is-authoritative: could not read the stored price back."
          1 -> raise Assay.Fail, message: "server-is-authoritative: the server recorded the client's tampered price (1) instead of its own — the client set a privileged field."
          _ -> :ok
        end
      end
    }
  end

  defp body_opts(token, nil), do: [bearer: token]
  defp body_opts(token, body), do: [bearer: token, json: body]
end
