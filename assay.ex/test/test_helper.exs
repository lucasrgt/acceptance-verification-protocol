ExUnit.start()

defmodule Repro do
  @moduledoc false
  # In-memory servers under verification: a correct one and a vulnerable one per
  # archetype. The verifier must pass the first and fail the second.

  def transport(handler) do
    fn request ->
      {status, body} = handler.(request)
      %{status: status, headers: [{"content-type", "application/json"}], body: Jason.encode!(body)}
    end
  end

  def bearer(%{headers: headers}),
    do: Enum.find_value(headers, fn {k, "Bearer " <> token} when k == "authorization" -> token; _ -> nil end)

  def header(%{headers: headers}, name), do: Enum.find_value(headers, fn {k, v} -> if k == name, do: v end)

  def status(verdict, id), do: Enum.find(verdict.results, &(&1.criterion_id == id)).status
end
