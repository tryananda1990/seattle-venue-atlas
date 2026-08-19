"use client";

import { useActionState } from "react";
import { VENUE_CATEGORY_LABELS, VENUE_CITY_LABELS } from "@/types/venue";
import { extractVenueData, publishVenue, type ExtractState } from "./actions";
import type { VenueExtraction } from "@/lib/venue-extraction";

const initialState: ExtractState = { data: null, sourceUrl: "", error: null };

const SOUND_OPTIONS: Record<string, string> = {
  unknown: "Unknown",
  included: "Included",
  extra_fee: "Available for extra fee",
  none: "Not available",
};

const FEE_UNIT_OPTIONS: Record<string, string> = {
  unknown: "Unknown",
  hour: "Per hour",
  day: "Per day",
  event: "Per event",
};

export function ImportForm() {
  const [state, formAction, isPending] = useActionState(extractVenueData, initialState);

  return (
    <div className="flex flex-col gap-8">
      <form action={formAction} className="flex gap-3">
        <input
          type="url"
          name="url"
          placeholder="https://venue-website.example.com"
          required
          className="flex-1 rounded border border-line bg-surface px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={isPending}
          className="rounded bg-accent text-white text-sm font-medium px-4 py-2 hover:opacity-90 disabled:opacity-50"
        >
          {isPending ? "Extracting…" : "Extract"}
        </button>
      </form>

      {state.error && <p className="text-sm text-red-500">{state.error}</p>}

      {state.data && <ReviewForm data={state.data} sourceUrl={state.sourceUrl} />}
    </div>
  );
}

function ReviewForm({ data, sourceUrl }: { data: VenueExtraction; sourceUrl: string }) {
  return (
    <form action={publishVenue} className="flex flex-col gap-4 border-t border-line pt-6">
      <p className="text-xs text-muted">
        Extracted from{" "}
        <a href={sourceUrl} target="_blank" rel="noopener noreferrer" className="underline">
          {sourceUrl}
        </a>
        . Review and correct every field before publishing — nothing here is guessed beyond what
        the page stated.
      </p>
      <input type="hidden" name="website_url" value={sourceUrl} />

      <Field label="Name" name="name" defaultValue={data.name ?? ""} required />

      <div className="grid grid-cols-2 gap-4">
        <SelectField
          label="Category"
          name="category"
          defaultValue={data.category_guess ?? ""}
          options={VENUE_CATEGORY_LABELS}
          required
        />
        <SelectField
          label="City"
          name="city"
          defaultValue={data.city_guess ?? ""}
          options={VENUE_CITY_LABELS}
          required
        />
      </div>

      <Field label="Address" name="address" defaultValue={data.address ?? ""} required />

      <div className="grid grid-cols-2 gap-4">
        <Field label="Capacity min" name="capacity_min" type="number" defaultValue={data.capacity_min ?? ""} />
        <Field label="Capacity max" name="capacity_max" type="number" defaultValue={data.capacity_max ?? ""} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <SelectField
          label="Sound system"
          name="sound_system"
          defaultValue={data.sound_system ?? "unknown"}
          options={SOUND_OPTIONS}
        />
        <Field
          label="Sound system notes"
          name="sound_system_notes"
          defaultValue={data.sound_system_notes ?? ""}
          textarea
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field
          label="Rental fee amount"
          name="rental_fee_amount"
          type="number"
          defaultValue={data.rental_fee_amount ?? ""}
        />
        <SelectField
          label="Fee unit"
          name="rental_fee_unit"
          defaultValue={data.rental_fee_unit ?? "unknown"}
          options={FEE_UNIT_OPTIONS}
        />
      </div>
      <Field label="Rental fee notes" name="rental_fee_notes" defaultValue={data.rental_fee_notes ?? ""} textarea />

      <Field
        label="Production notes (load-in, power, backline)"
        name="production_notes"
        defaultValue={data.production_notes ?? ""}
        textarea
      />

      <Field
        label="Amenities (comma-separated)"
        name="amenities"
        defaultValue={(data.amenities ?? []).join(", ")}
      />

      <Field label="Description" name="description" defaultValue={data.description ?? ""} textarea />

      <div className="grid grid-cols-2 gap-4">
        <Field label="Reservation URL" name="reservation_url" defaultValue={data.reservation_url ?? ""} />
        <Field label="Contact email" name="contact_email" defaultValue={data.contact_email ?? ""} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Contact form URL" name="contact_form_url" defaultValue={data.contact_form_url ?? ""} />
        <Field label="Phone" name="phone" defaultValue={data.phone ?? ""} />
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          name="verification_status"
          value="verified"
          className="rounded bg-accent text-white text-sm font-medium px-4 py-2 hover:opacity-90"
        >
          Publish
        </button>
        <button
          type="submit"
          name="verification_status"
          value="needs_review"
          className="rounded border border-line text-sm font-medium px-4 py-2 hover:border-accent"
        >
          Save as draft
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  name,
  defaultValue,
  required,
  type = "text",
  textarea = false,
}: {
  label: string;
  name: string;
  defaultValue?: string | number;
  required?: boolean;
  type?: string;
  textarea?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="text-xs uppercase tracking-wide text-muted">{label}</span>
      {textarea ? (
        <textarea
          name={name}
          defaultValue={defaultValue}
          required={required}
          rows={3}
          className="rounded border border-line bg-surface px-3 py-2"
        />
      ) : (
        <input
          type={type}
          name={name}
          defaultValue={defaultValue}
          required={required}
          className="rounded border border-line bg-surface px-3 py-2"
        />
      )}
    </label>
  );
}

function SelectField({
  label,
  name,
  defaultValue,
  options,
  required,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  options: Record<string, string>;
  required?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="text-xs uppercase tracking-wide text-muted">{label}</span>
      <select
        name={name}
        defaultValue={defaultValue}
        required={required}
        className="rounded border border-line bg-surface px-3 py-2"
      >
        <option value="" disabled={required}>
          Select…
        </option>
        {Object.entries(options).map(([value, optLabel]) => (
          <option key={value} value={value}>
            {optLabel}
          </option>
        ))}
      </select>
    </label>
  );
}
