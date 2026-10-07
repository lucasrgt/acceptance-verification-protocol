defmodule Assay.TransportTest do
  use ExUnit.Case, async: true

  defp serve(status, body) do
    {:ok, socket} = :gen_tcp.listen(0, [:binary, active: false, reuseaddr: true])
    {:ok, port} = :inet.port(socket)

    spawn_link(fn ->
      {:ok, client} = :gen_tcp.accept(socket)
      {:ok, request} = :gen_tcp.recv(client, 0)
      send(:transport_test, {:request, request})
      :gen_tcp.send(client, "HTTP/1.1 #{status} X\r\ncontent-type: application/json\r\ncontent-length: #{byte_size(body)}\r\nconnection: close\r\n\r\n#{body}")
      :gen_tcp.close(client)
    end)

    "http://127.0.0.1:#{port}"
  end

  setup do
    Process.register(self(), :transport_test)
    :ok
  end

  test "httpc reaches a real server with the bearer and JSON body" do
    base = serve(201, ~s({"id":7}))
    response = Assay.Http.request(base, :post, "/orders", bearer: "t", json: %{a: 1})
    assert response.status == 201
    assert Assay.Http.json!(response, "create") == %{"id" => 7}
    assert_received {:request, request}
    assert request =~ "authorization: Bearer t"
    assert request =~ ~s({"a":1})
  end

  test "an unreachable server fails the criterion" do
    assert_raise Assay.Fail, ~r/did not complete/, fn -> Assay.Http.request("http://127.0.0.1:1", :get, "/") end
  end

  test "a non-JSON body fails the criterion" do
    assert_raise Assay.Fail, ~r/not JSON/, fn -> Assay.Http.json!(%{body: "<html>"}, "read") end
  end

  defmodule Echo do
    import Plug.Conn
    def init(opts), do: opts

    def call(conn, _opts) do
      {:ok, body, conn} = read_body(conn)
      send_resp(conn, 200, Jason.encode!(%{path: conn.request_path, auth: get_req_header(conn, "authorization"), body: body}))
    end
  end

  test "plug calls an endpoint in process" do
    response = Assay.Http.plug(Echo).(%{method: :post, path: "/x", headers: [{"authorization", "Bearer p"}], body: "{}"})
    assert %{"path" => "/x", "auth" => ["Bearer p"], "body" => "{}"} = Jason.decode!(response.body)

    verdict =
      Assay.run(Assay.AccessControl, "plug", %Assay.AccessControl.Subject{protected_path: "/x"}, transport: Assay.Http.plug(Echo))

    assert Repro.status(verdict, "requires-authentication") == :fail
  end
end
