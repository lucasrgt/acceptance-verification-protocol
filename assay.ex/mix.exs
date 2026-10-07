defmodule Assay.MixProject do
  use Mix.Project

  def project do
    [
      app: :assay_ex,
      version: "0.4.0",
      elixir: "~> 1.17",
      start_permanent: Mix.env() == :prod,
      deps: [{:jason, "~> 1.4"}, {:plug, "~> 1.16", optional: true}],
      test_coverage: [summary: [threshold: 95]],
      description: "Elixir reference implementation of the Acceptance Verification Protocol (HTTP substrate).",
      package: [licenses: ["MIT"], files: ~w(lib priv mix.exs README.md)]
    ]
  end

  def application, do: [extra_applications: [:inets, :ssl]]
end
