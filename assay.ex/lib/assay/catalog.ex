defmodule Assay.Catalog do
  @moduledoc "The neutral AVP catalog this adapter binds oracles to."

  def bundled, do: load(Application.app_dir(:assay_ex, "priv/catalog.json"))

  def load(path), do: path |> File.read!() |> Jason.decode!()

  def archetype!(catalog, name) do
    Enum.find(catalog["archetypes"], &(&1["archetype"] == name)) ||
      raise ArgumentError, "Archetype '#{name}' is not in the catalog (protocol drift?)."
  end
end
