defmodule Assay.Http do
  @moduledoc """
  The `http` substrate's assertion vocabulary and transport. A transport is a
  function from a request map (`method`, `path`, `headers`, `body`) to a
  response map (`status`, `headers`, `body`). `httpc/1` reaches a real server;
  `plug/1` calls a Plug (a Phoenix endpoint) in process, so a proof reuses the
  app's test setup with no port. `Assay.run/4` installs the transport for the
  run; oracles call `request/4`.
  """

  @key {__MODULE__, :transport}

  @doc false
  def with_transport(nil, fun), do: fun.()

  def with_transport(transport, fun) do
    previous = Process.get(@key)
    Process.put(@key, transport)

    try do
      fun.()
    after
      if previous, do: Process.put(@key, previous), else: Process.delete(@key)
    end
  end

  @doc "Sends a request through the run's transport, or a real one to `base_url`."
  def request(base_url, method, path, opts \\ []) do
    headers =
      [{"accept", "application/json"} | List.wrap(opts[:headers])]
      |> then(&if bearer = opts[:bearer], do: [{"authorization", "Bearer " <> bearer} | &1], else: &1)

    {headers, body} =
      case Keyword.fetch(opts, :json) do
        {:ok, json} -> {[{"content-type", "application/json"} | headers], Jason.encode!(json)}
        :error -> {headers, opts[:body]}
      end

    transport = Process.get(@key) || httpc(base_url)
    transport.(%{method: method, path: path, headers: headers, body: body})
  end

  @doc "A transport over a real socket, with a per-request deadline (ASSAY_HTTP_TIMEOUT_MS, default 10s)."
  def httpc(base_url) do
    timeout = String.to_integer(System.get_env("ASSAY_HTTP_TIMEOUT_MS", "10000"))

    fn %{method: method, path: path, headers: headers, body: body} ->
      url = String.to_charlist(base_url <> path)
      plain = for {k, v} <- headers, k != "content-type", do: {String.to_charlist(k), String.to_charlist(v)}
      type = Enum.find_value(headers, ~c"application/json", fn {k, v} -> if k == "content-type", do: String.to_charlist(v) end)
      request = if body, do: {url, plain, type, body}, else: {url, plain}

      case :httpc.request(method, request, [timeout: timeout], body_format: :binary) do
        {:ok, {{_, status, _}, response_headers, response_body}} ->
          %{status: status, headers: for({k, v} <- response_headers, do: {to_string(k), to_string(v)}), body: response_body}

        {:error, reason} ->
          raise Assay.Fail, message: "#{method} #{path}: the request did not complete (#{inspect(reason)})"
      end
    end
  end

  if Code.ensure_loaded?(Plug.Test) do
    @doc "A transport that calls `plug` (e.g. a Phoenix endpoint) in process."
    def plug(plug, opts \\ []) do
      fn %{method: method, path: path, headers: headers, body: body} ->
        conn =
          Enum.reduce(headers, Plug.Test.conn(method, path, body || ""), fn {k, v}, conn ->
            Plug.Conn.put_req_header(conn, k, v)
          end)

        conn = plug.call(conn, plug.init(opts))
        %{status: conn.status, headers: conn.resp_headers, body: conn.resp_body}
      end
    end
  end

  @doc "Decodes a JSON body, failing the criterion when it is not JSON."
  def json!(%{body: body}, what) do
    case Jason.decode(body || "") do
      {:ok, value} -> value
      {:error, _} -> raise Assay.Fail, message: "#{what}: the response body is not JSON (#{inspect(body)})."
    end
  end

  @doc "The request was refused at the authorization boundary (401/403/404 unless `reject_with`). A 5xx never counts."
  def refused!(%{status: status}, what, reject_with \\ [401, 403, 404]) do
    unless status in reject_with do
      raise Assay.Fail,
        message:
          "#{what}: expected a refusal (#{Enum.join(reject_with, "/")}), got #{status} — " <>
            if(status in 200..299, do: "the server let it through.", else: "a crash/unexpected status is not a refusal.")
    end
  end

  @doc "The request was accepted (2xx)."
  def accepted!(%{status: status}, what) do
    unless status in 200..299, do: raise(Assay.Fail, message: "#{what}: expected acceptance (2xx), got #{status}.")
  end

  @doc "The request was rejected with a client error (4xx)."
  def rejected!(%{status: status}, what) do
    unless status in 400..499, do: raise(Assay.Fail, message: "#{what}: expected a 4xx rejection, got #{status}.")
  end
end
