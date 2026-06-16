# Shiprocket WMS — Demo Prototype

## What this is

This is a **clickable demo** of a Warehouse Management System. It is **not a production app** — there is no backend, data is mocked, and anything you change resets on refresh.

Its purpose is to act as a shared reference point:

- **For business** — a working prototype to react to and discuss. You can click through real flows instead of imagining them from a slide.
- **For engineering** — a concrete, end-to-end picture of the intended screens, fields, and steps. It communicates intent far better than a static wireframe, because the navigation, tabs, statuses, and table columns all behave like the real thing.

Think of it as a high-fidelity conversation starter: detailed enough to align everyone on scope, loose enough to change quickly.

## How to run

```
bun install
bun dev
```

Then open the local URL shown in the terminal.

## Features

The demo is organised into the same modules a warehouse team would use day to day.

### Outbound
- **Order View** — list of orders with key details (order number, channel, courier, status, city/state, item count, dates) plus filters and a trend sparkline.
- **Order Details View** — item-level breakdown for a single order.
- **Picking** — pick execution screen, plus a View Picklists list and a picklist detail view (picklist summary and picked-SKU details tabs).
- **Sort** — sortation into destinations.
- **Putwall** — put-to-wall consolidation.
- **Packing** — pack execution, plus a View Packlists list and a pack detail view (item view / box view) including a printable box label.
- **Manifest** — create a manifest, plus a View Manifests list with status tracking (created / part shipped / shipped).
- **Dispatch** — dispatch flow, plus a View Shiplists list.

### Inbound
- **Gate Entry** — record vehicles and gate passes at arrival.
- **Unloading** — unload against a gate pass (standard inbound and returns flows).
- **GRN** — goods receipt against inbound.
- **Sales Return GRN** — receive customer returns, including handling for unidentified items.
- **Putaway** — move received stock to storage.

### Inventory
- **Detailed Inventory View** — stock visibility across locations and bins.
- **Item Movement** — ad-hoc item or bin movement, done directly without a task.
- **Create Movement** — supervisors raise movement tasks via form or Excel upload.
- **Bin Inventory** — update item/bin information.
- **Approvals** — review and approve pending actions.
- **Replenishment** — min/max replenishment policy with template download and upload.

### Masters & Reports
- **Dock Management** — manage docks.
- **Reports** — operational reporting views.

## Notes

- Frontend only — no real APIs, no persistence.
- Sample data is illustrative and chosen to make each flow easy to walk through.
