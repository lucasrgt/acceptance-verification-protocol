defmodule Assay.MoneyIntegrity do
  @moduledoc "money-integrity — a split never leaks a cent: shares are non-negative, sum to the total and follow the declared fraction."
  @behaviour Assay
  alias Assay.Http

  @totals [1001, 333, 9999, 100, 1, 7, 4567, 12_345]

  defmodule Subject do
    @enforce_keys [:split_path, :platform_fraction_bps]
    defstruct [:base_url, :split_path, :platform_fraction_bps, :bearer]
  end

  @impl true
  def name, do: "money-integrity"

  @impl true
  def oracles do
    %{
      "split-invariant" => fn s ->
        for total <- @totals do
          response = Http.request(s.base_url, :get, "#{s.split_path}?total=#{total}", bearer: s.bearer)
          Http.accepted!(response, "splitting total #{total} cents")
          %{"platform" => platform, "host" => host} = Http.json!(response, "splitting total #{total} cents")
          expected = div(total * s.platform_fraction_bps, 10_000)

          cond do
            platform < 0 or host < 0 ->
              raise Assay.Fail, message: "split of total #{total} has a negative share (platform=#{platform}, host=#{host})."

            platform + host != total ->
              raise Assay.Fail, message: "split of total #{total} does not sum to the whole: #{platform} + #{host} != #{total} (a cent leaked)."

            platform != expected ->
              raise Assay.Fail, message: "split of total #{total}: platform share #{platform} != policy amount #{expected} cents (#{s.platform_fraction_bps} bps)."

            true ->
              :ok
          end
        end
      end
    }
  end
end
