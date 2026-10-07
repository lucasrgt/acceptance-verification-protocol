defmodule Assay.CalibrationTest do
  use ExUnit.Case, async: true
  import Repro

  defp run(archetype, subject, handler), do: Assay.run(archetype, "repro", subject, transport: transport(handler))

  describe "access-control" do
    @subject %Assay.AccessControl.Subject{protected_path: "/me"}

    test "passes a server that refuses the anonymous caller and fails one that serves it" do
      good = run(Assay.AccessControl, @subject, fn req -> if bearer(req), do: {200, %{}}, else: {401, %{}} end)
      bad = run(Assay.AccessControl, @subject, fn _ -> {200, %{id: 1}} end)
      crash = run(Assay.AccessControl, @subject, fn _ -> {500, %{}} end)
      assert status(good, "requires-authentication") == :pass
      assert status(bad, "requires-authentication") == :fail
      assert status(crash, "requires-authentication") == :fail
    end
  end

  describe "authorization" do
    @subject %Assay.Authorization.Subject{
      owner_token: "alice",
      own_resource: "/notes/alice-1",
      others_resource: "/notes/bob-1",
      admin_path: "/admin",
      admin_token: "root",
      lesser_token: "alice",
      write_path: "/items",
      read_path: "/items/last",
      token: "alice"
    }

    defp owner_server(trust_client?) do
      table = :ets.new(:items, [:public])

      fn
        %{path: "/notes/" <> id} = req ->
          if trust_client? or String.starts_with?(id, bearer(req) || "-"), do: {200, %{}}, else: {404, %{}}

        %{path: "/admin"} = req ->
          if trust_client? or bearer(req) == "root", do: {200, %{}}, else: {403, %{}}

        %{path: "/items", body: body} ->
          price = if trust_client?, do: Jason.decode!(body)["price"], else: 100
          :ets.insert(table, {:last, price})
          {201, %{}}

        %{path: "/items/last"} ->
          [{:last, price}] = :ets.lookup(table, :last)
          {200, %{price: price}}
      end
    end

    test "passes ownership, role and server-resolved price; fails a server that trusts the client" do
      good = run(Assay.Authorization, @subject, owner_server(false))
      bad = run(Assay.Authorization, @subject, owner_server(true))
      for id <- ["own-resource-only", "role-required", "server-is-authoritative"], do: assert(status(good, id) == :pass)
      for id <- ["own-resource-only", "role-required", "server-is-authoritative"], do: assert(status(bad, id) == :fail)
      assert Assay.Verdict.outcome(good) == :pass
    end

    test "seams a subject does not provide are not applicable, never green" do
      subject = %Assay.Authorization.Subject{owner_token: "alice", own_resource: "/notes/alice-1", others_resource: "/notes/bob-1"}
      verdict = run(Assay.Authorization, subject, owner_server(false))
      assert status(verdict, "role-required") == :not_applicable
      assert status(verdict, "server-is-authoritative") == :not_applicable

      reader = fn
        %{path: "/items/last"} -> {200, %{}}
        _ -> {200, %{}}
      end

      missing = run(Assay.Authorization, %{@subject | admin_path: nil}, reader)
      assert status(missing, "server-is-authoritative") == :fail
    end
  end

  describe "lifecycle-gate" do
    @subject %Assay.LifecycleGate.Subject{ready_transition_path: "/publish/ready", unmet_transition_path: "/publish/draft", bearer: "host"}

    test "passes a server-side guard and fails an interface-only gate" do
      good = run(Assay.LifecycleGate, @subject, fn %{path: path} -> if path == "/publish/ready", do: {200, %{}}, else: {409, %{}} end)
      bad = run(Assay.LifecycleGate, @subject, fn _ -> {200, %{}} end)
      assert status(good, "gate-enforced-server-side") == :pass
      assert status(bad, "gate-enforced-server-side") == :fail
    end
  end

  describe "request-idempotency" do
    @subject %Assay.RequestIdempotency.Subject{create_path: "/orders", id_field: ["data", "id"]}

    defp idempotency_server(mode) do
      seen = :ets.new(:keys, [:public])
      counter = :counters.new(1, [])

      fn req ->
        key = header(req, "idempotency-key")
        :counters.add(counter, 1, 1)
        next = :counters.get(counter, 1)

        id =
          case {mode, :ets.lookup(seen, key)} do
            {:honors, [{_, id}]} -> id
            {:dedups_everything, _} -> 1
            _ -> :ets.insert(seen, {key, next}) && next
          end

        {201, %{data: %{id: id}}}
      end
    end

    test "passes a server that replays per key and fails one that ignores or over-applies the key" do
      assert status(run(Assay.RequestIdempotency, @subject, idempotency_server(:honors)), "idempotency-key-honored") == :pass
      assert status(run(Assay.RequestIdempotency, @subject, idempotency_server(:ignores)), "idempotency-key-honored") == :fail
      assert status(run(Assay.RequestIdempotency, @subject, idempotency_server(:dedups_everything)), "idempotency-key-honored") == :fail
      assert status(run(Assay.RequestIdempotency, @subject, fn _ -> {201, %{data: %{}}} end), "idempotency-key-honored") == :fail
    end
  end

  describe "resource-uniqueness" do
    @subject %Assay.ResourceUniqueness.Subject{create_path: "/plates", body: %{plate: "ABC1D23"}}

    test "passes a conflict on the second create and fails a silent duplicate" do
      taken = :ets.new(:taken, [:public])
      good = run(Assay.ResourceUniqueness, @subject, fn _ -> if :ets.insert_new(taken, {:plate}), do: {201, %{}}, else: {409, %{}} end)
      bad = run(Assay.ResourceUniqueness, @subject, fn _ -> {201, %{}} end)
      assert status(good, "rejects-duplicate") == :pass
      assert status(bad, "rejects-duplicate") == :fail
    end
  end

  describe "money-integrity" do
    @subject %Assay.MoneyIntegrity.Subject{split_path: "/split", platform_fraction_bps: 1250}

    defp split(fun), do: fn %{path: "/split?total=" <> total} -> {200, fun.(String.to_integer(total))} end

    test "passes an exact split and fails leaks, negative shares and drifting fractions" do
      exact = split(fn total -> platform = div(total * 1250, 10_000); %{platform: platform, host: total - platform} end)
      leak = split(fn total -> %{platform: round(total * 0.125), host: round(total * 0.875)} end)
      negative = split(fn total -> %{platform: -1, host: total + 1} end)
      drift = split(fn total -> %{platform: total, host: 0} end)
      assert status(run(Assay.MoneyIntegrity, @subject, exact), "split-invariant") == :pass
      for bad <- [leak, negative, drift], do: assert(status(run(Assay.MoneyIntegrity, @subject, bad), "split-invariant") == :fail)
    end
  end
end
