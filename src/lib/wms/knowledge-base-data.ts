export type KbBlock =
  | { type: "paragraph"; text: string }
  | { type: "ordered"; items: string[] }
  | { type: "unordered"; items: string[] }
  | { type: "checklist"; items: string[] }
  | { type: "table"; header: string[]; rows: string[][] }
  | {
      type: "callout";
      tone: "info" | "warning" | "danger" | "success" | "neutral";
      icon: string;
      items: ({ type: "text"; text: string } | { type: "image"; src: string })[];
    };

export interface KbSection {
  id: string;
  title: string;
  level: number;
  blocks: KbBlock[];
  children: KbSection[];
}

export const knowledgeBaseSections: KbSection[] = [
  {
    "id": "getting-started",
    "title": "Getting Started",
    "level": 1,
    "blocks": [
      {
        "type": "paragraph",
        "text": "The information in this section applies before or across warehouse operations."
      }
    ],
    "children": [
      {
        "id": "brand-configuration",
        "title": "Brand Configuration",
        "level": 2,
        "blocks": [
          {
            "type": "ordered",
            "items": [
              "Open **Settings \u2192 Brand Configuration**.",
              "Select the seller/brand.",
              "Configure the Picklist Cutoff Window to define active automatic picklist hours.",
              "Enable only the required controls:"
            ]
          },
          {
            "type": "unordered",
            "items": [
              "Batch and expiry tracking",
              "Inbound SKU scan required",
              "Outbound SKU scan required",
              "Additional SKU validation",
              "USN tracking",
              "Inbound shelf-life check",
              "Outbound shelf-life check"
            ]
          },
          {
            "type": "ordered",
            "items": [
              "Configure shelf-life thresholds at SKU level where applicable.",
              "Save and validate the behaviour with a controlled test transaction."
            ]
          },
          {
            "type": "callout",
            "tone": "info",
            "icon": "\ud83d\udca1",
            "items": [
              {
                "type": "text",
                "text": "Configuration changes affect operating steps and required fields. Coordinate changes with the product/super-admin team and communicate them to warehouse operators."
              }
            ]
          }
        ],
        "children": []
      }
    ]
  },
  {
    "id": "inbound-operations",
    "title": "Inbound Operations",
    "level": 1,
    "blocks": [],
    "children": [
      {
        "id": "process-overview",
        "title": "Process overview",
        "level": 2,
        "blocks": [
          {
            "type": "table",
            "header": [
              "Sequence",
              "Module",
              "Primary role",
              "Completion output"
            ],
            "rows": [
              [
                "1",
                "Gate Entry",
                "Guard",
                "Gate pass and active gate-entry record"
              ],
              [
                "2",
                "Unloading",
                "Dock manager / Unloader",
                "Scanned boxes, POD, and unloading completion"
              ],
              [
                "3",
                "QC / GRN",
                "QC operator",
                "Accepted quantities, grades, batches, and exceptions"
              ],
              [
                "4",
                "Put Away",
                "Put-away operator",
                "Inventory stored in valid locations and made available"
              ]
            ]
          },
          {
            "type": "callout",
            "tone": "warning",
            "icon": "\u26a0\ufe0f",
            "items": [
              {
                "type": "text",
                "text": "Inventory becomes available for order allocation only after Put Away is completed. Completing QC/GRN alone does not make inventory live."
              }
            ]
          }
        ],
        "children": []
      },
      {
        "id": "1-gate-entry",
        "title": "1. Gate Entry",
        "level": 2,
        "blocks": [],
        "children": [
          {
            "id": "objective",
            "title": "Objective",
            "level": 3,
            "blocks": [
              {
                "type": "paragraph",
                "text": "Create the inbound vehicle record, associate the correct ASN/STN/PO/vendor, capture physical and transport details, upload required documents, and generate the gate pass."
              }
            ],
            "children": []
          },
          {
            "id": "role-and-prerequisites",
            "title": "Role and prerequisites",
            "level": 3,
            "blocks": [
              {
                "type": "unordered",
                "items": [
                  "**Role:** Guard",
                  "Vehicle has arrived at the warehouse gate.",
                  "ASN, STN, PO, or vendor details are available.",
                  "Physical box count is known.",
                  "Invoice or Challan is available for upload or capture.",
                  "Driver and vehicle details are available."
                ]
              }
            ],
            "children": []
          },
          {
            "id": "step-1-open-the-gate-entry-module",
            "title": "Step 1 \u2014 Open the Gate Entry module",
            "level": 3,
            "blocks": [
              {
                "type": "ordered",
                "items": [
                  "Sign in with the Guard user role.",
                  "From the left navigation, open **Inbound \u2192 Gate Entry**.",
                  "Review the list view and status tabs:"
                ]
              },
              {
                "type": "unordered",
                "items": [
                  "**All:** every gate-entry record.",
                  "**Created:** new entries awaiting further processing.",
                  "**Dock Assigned:** entries assigned for unloading.",
                  "**Closed:** vehicles that have completed unloading and exited."
                ]
              },
              {
                "type": "ordered",
                "items": [
                  "Click **Create New Gate Entry**."
                ]
              },
              {
                "type": "callout",
                "tone": "neutral",
                "icon": "\ud83d\udcf7",
                "items": [
                  {
                    "type": "text",
                    "text": "**Screenshot 1 \u2014 Gate Entry list:**"
                  },
                  {
                    "type": "image",
                    "src": "/knowledge-base/img_000.webp"
                  }
                ]
              }
            ],
            "children": []
          },
          {
            "id": "step-2-select-the-entry-type",
            "title": "Step 2 \u2014 Select the entry type",
            "level": 3,
            "blocks": [
              {
                "type": "ordered",
                "items": [
                  "Select the applicable entry type:"
                ]
              },
              {
                "type": "unordered",
                "items": [
                  "**Seller:** vehicle carrying seller inventory against an ASN/PO.",
                  "**Visitor:** visitor entry.",
                  "**Scrap:** scrap movement.",
                  "**Infra:** infrastructure-related movement."
                ]
              },
              {
                "type": "ordered",
                "items": [
                  "For a standard inbound receipt, select **Seller**.",
                  "Click **Continue**."
                ]
              },
              {
                "type": "callout",
                "tone": "neutral",
                "icon": "\ud83d\udcf7",
                "items": [
                  {
                    "type": "text",
                    "text": "**Screenshot 2 \u2014 Entry type selection:**"
                  },
                  {
                    "type": "image",
                    "src": "/knowledge-base/img_001.webp"
                  }
                ]
              }
            ],
            "children": []
          },
          {
            "id": "step-3-enter-transporter-driver-and-vehicle-details",
            "title": "Step 3 \u2014 Enter transporter, driver, and vehicle details",
            "level": 3,
            "blocks": [
              {
                "type": "ordered",
                "items": [
                  "Verify or enter the entry date and time.",
                  "Select the gate number.",
                  "Select the transporter from the list.",
                  "If the transporter does not exist, click **Add New**, enter the transporter name, and save it.",
                  "Enter the driver\u2019s name and mobile number.",
                  "Enter the vehicle number.",
                  "Upload or capture the front and back of the driving licence, when required.",
                  "Select the vehicle type, such as:"
                ]
              },
              {
                "type": "unordered",
                "items": [
                  "32-ft container",
                  "Mini truck",
                  "Pickup",
                  "Other configured type"
                ]
              },
              {
                "type": "ordered",
                "items": [
                  "Record the vehicle condition:"
                ]
              },
              {
                "type": "unordered",
                "items": [
                  "Good",
                  "Damaged",
                  "Leaking",
                  "Dirty"
                ]
              },
              {
                "type": "ordered",
                "items": [
                  "Recheck the details against the physical vehicle and documents before continuing."
                ]
              },
              {
                "type": "callout",
                "tone": "neutral",
                "icon": "\ud83d\udcf7",
                "items": [
                  {
                    "type": "text",
                    "text": "**Screenshot 3 \u2014 Vehicle details form:**"
                  },
                  {
                    "type": "image",
                    "src": "/knowledge-base/img_002.webp"
                  }
                ]
              }
            ],
            "children": []
          },
          {
            "id": "step-4-search-and-select-the-inbound-reference",
            "title": "Step 4 \u2014 Search and select the inbound reference",
            "level": 3,
            "blocks": [
              {
                "type": "ordered",
                "items": [
                  "In the search field, select or scan the relevant reference type:"
                ]
              },
              {
                "type": "unordered",
                "items": [
                  "ASN",
                  "STN",
                  "PO",
                  "Vendor"
                ]
              },
              {
                "type": "ordered",
                "items": [
                  "Enter at least 3\u20134 characters of the reference number or vendor name.",
                  "Select the correct record from the results.",
                  "Confirm that the system auto-populates the seller/vendor and related inbound details.",
                  "Verify the reference carefully. Do not proceed if the seller, SKU context, or expected quantity does not match the documents."
                ]
              },
              {
                "type": "callout",
                "tone": "info",
                "icon": "\ud83d\udca1",
                "items": [
                  {
                    "type": "text",
                    "text": "Use the ASN/STN/PO/vendor search rather than entering a full reference blindly. The suggestion list reduces data-entry errors."
                  }
                ]
              },
              {
                "type": "callout",
                "tone": "neutral",
                "icon": "\ud83d\udcf7",
                "items": [
                  {
                    "type": "text",
                    "text": "**Screenshot 4 \u2014 ASN search:**"
                  },
                  {
                    "type": "image",
                    "src": "/knowledge-base/img_003.webp"
                  }
                ]
              }
            ],
            "children": []
          },
          {
            "id": "step-5-enter-box-count-and-verify-stock-count",
            "title": "Step 5 \u2014 Enter box count and verify stock count",
            "level": 3,
            "blocks": [
              {
                "type": "ordered",
                "items": [
                  "Count the physical boxes visible in the vehicle.",
                  "Enter the number in **Box Count**.",
                  "Verify the **Stock Count**, which represents the total item quantity listed against the SKU(s) in the invoice/ASN.",
                  "Do not confuse the two fields:"
                ]
              },
              {
                "type": "unordered",
                "items": [
                  "**Box Count:** physical packages/boxes received.",
                  "**Stock Count:** total units across the SKU quantities."
                ]
              },
              {
                "type": "ordered",
                "items": [
                  "Reconcile obvious mismatches with the transporter or receiving team before submitting."
                ]
              },
              {
                "type": "callout",
                "tone": "warning",
                "icon": "\u26a0\ufe0f",
                "items": [
                  {
                    "type": "text",
                    "text": "Box Count is mandatory and must reflect the physical boxes visible at the gate. It is not the item quantity."
                  }
                ]
              },
              {
                "type": "callout",
                "tone": "neutral",
                "icon": "\ud83d\udcf7",
                "items": [
                  {
                    "type": "text",
                    "text": "**Screenshot 5 \u2014 Seller details:**"
                  },
                  {
                    "type": "image",
                    "src": "/knowledge-base/img_004.webp"
                  }
                ]
              }
            ],
            "children": []
          },
          {
            "id": "step-6-upload-documents-and-submit-seller-details",
            "title": "Step 6 \u2014 Upload documents and submit seller details",
            "level": 3,
            "blocks": [
              {
                "type": "ordered",
                "items": [
                  "Upload or capture the mandatory receiving document:"
                ]
              },
              {
                "type": "unordered",
                "items": [
                  "Invoice, or",
                  "Challan"
                ]
              },
              {
                "type": "ordered",
                "items": [
                  "Add optional documents when applicable:"
                ]
              },
              {
                "type": "unordered",
                "items": [
                  "LR copy",
                  "E-way bill",
                  "Vehicle image",
                  "HST image"
                ]
              },
              {
                "type": "ordered",
                "items": [
                  "Open each uploaded image to confirm it is readable and belongs to the selected seller/reference.",
                  "Replace any blurred, cropped, or incorrect image.",
                  "Click **Submit Seller Details** to save the current seller\u2019s details and uploaded documents.",
                  "Confirm that the seller appears in the submitted seller list before proceeding."
                ]
              },
              {
                "type": "callout",
                "tone": "warning",
                "icon": "\u26a0\ufe0f",
                "items": [
                  {
                    "type": "text",
                    "text": "The image/document must be uploaded and the current seller\u2019s details must be submitted before another seller can be selected."
                  }
                ]
              },
              {
                "type": "callout",
                "tone": "neutral",
                "icon": "\ud83d\udcf7",
                "items": [
                  {
                    "type": "text",
                    "text": "**Screenshot 6 \u2014 Document upload and submission:**"
                  },
                  {
                    "type": "image",
                    "src": "/knowledge-base/img_005.webp"
                  }
                ]
              }
            ],
            "children": []
          },
          {
            "id": "step-7-add-another-seller-when-required",
            "title": "Step 7 \u2014 Add another seller when required",
            "level": 3,
            "blocks": [
              {
                "type": "ordered",
                "items": [
                  "After the first seller\u2019s details have been submitted, click **Add Seller**.",
                  "Use this option only when the same vehicle carries material for more than one seller.",
                  "Search and select the additional seller\u2019s ASN/STN/PO/vendor.",
                  "Verify the auto-populated seller information.",
                  "Enter the physical box count for the additional seller.",
                  "Upload the required image/document for that seller.",
                  "Click **Submit Seller Details** to save the additional seller.",
                  "Repeat these steps for every additional seller.",
                  "Confirm that all submitted sellers appear as separate sections before previewing."
                ]
              },
              {
                "type": "callout",
                "tone": "info",
                "icon": "\ud83d\udca1",
                "items": [
                  {
                    "type": "text",
                    "text": "Multi-seller vehicles are expected to be rare. Do not add another seller merely because the vehicle contains multiple SKUs for the same seller."
                  }
                ]
              }
            ],
            "children": []
          },
          {
            "id": "step-8-preview-and-validate",
            "title": "Step 8 \u2014 Preview and validate",
            "level": 3,
            "blocks": [
              {
                "type": "ordered",
                "items": [
                  "Click **Preview**.",
                  "Validate the summary:"
                ]
              },
              {
                "type": "unordered",
                "items": [
                  "Date and time",
                  "Gate number",
                  "Transporter",
                  "Entry type",
                  "Driver name",
                  "Vehicle number",
                  "Seller(s)",
                  "Box count",
                  "Stock count",
                  "Uploaded documents"
                ]
              },
              {
                "type": "ordered",
                "items": [
                  "If anything is incorrect, return to the form and correct it.",
                  "If all details are accurate, click **Create Gate Entry**."
                ]
              },
              {
                "type": "callout",
                "tone": "neutral",
                "icon": "\ud83d\udcf7",
                "items": [
                  {
                    "type": "text",
                    "text": "**Screenshot 7 \u2014 Gate Entry preview:**"
                  },
                  {
                    "type": "image",
                    "src": "/knowledge-base/img_006.webp"
                  }
                ]
              }
            ],
            "children": []
          },
          {
            "id": "step-9-generate-and-verify-the-gate-pass",
            "title": "Step 9 \u2014 Generate and verify the gate pass",
            "level": 3,
            "blocks": [
              {
                "type": "ordered",
                "items": [
                  "After creation, open the generated gate pass.",
                  "Verify the movement/activity type is **Inbound**.",
                  "Confirm seller, box count, stock quantity, vehicle, and document details.",
                  "Print or provide the gate pass according to warehouse SOP.",
                  "For a multi-seller vehicle, confirm that the system generated one gate pass per seller.",
                  "Check that the new record appears in the Gate Entry list with the correct status."
                ]
              },
              {
                "type": "callout",
                "tone": "neutral",
                "icon": "\ud83d\udcf7",
                "items": [
                  {
                    "type": "text",
                    "text": "**Screenshot 8 \u2014 Generated gate pass:**"
                  },
                  {
                    "type": "image",
                    "src": "/knowledge-base/img_007.webp"
                  }
                ]
              }
            ],
            "children": []
          },
          {
            "id": "gate-entry-completion-checklist",
            "title": "Gate Entry completion checklist",
            "level": 3,
            "blocks": [
              {
                "type": "checklist",
                "items": [
                  "Correct entry type selected",
                  "Correct ASN/STN/PO/vendor selected",
                  "Transporter, driver, and vehicle details verified",
                  "Vehicle condition recorded",
                  "Physical Box Count entered correctly",
                  "Stock Count verified against the inbound reference",
                  "Mandatory Invoice/Challan uploaded and readable",
                  "Additional sellers added only when applicable",
                  "Preview validated before creation",
                  "Gate pass generated and checked"
                ]
              }
            ],
            "children": []
          }
        ]
      },
      {
        "id": "2-unloading",
        "title": "2. Unloading",
        "level": 2,
        "blocks": [],
        "children": [
          {
            "id": "objective",
            "title": "Objective",
            "level": 3,
            "blocks": [
              {
                "type": "paragraph",
                "text": "Label and scan each received box, record its condition, upload POD, and complete unloading."
              }
            ],
            "children": []
          },
          {
            "id": "role-and-prerequisites",
            "title": "Role and prerequisites",
            "level": 3,
            "blocks": [
              {
                "type": "unordered",
                "items": [
                  "**Role:** Dock manager / Unloader",
                  "Gate entry has been created.",
                  "Vehicle is positioned for unloading.",
                  "Printer, labels, and scanner are available."
                ]
              }
            ],
            "children": []
          },
          {
            "id": "step-by-step-procedure",
            "title": "Step-by-step procedure",
            "level": 3,
            "blocks": [
              {
                "type": "ordered",
                "items": [
                  "Open **Inbound \u2192 Unloading**.",
                  "Locate the task using Gate Entry, PO, Gate Pass, or Vendor Name.",
                  "Open the task and confirm the expected number of boxes.",
                  "Click **Confirm and Print** to print box-ID labels.",
                  "Attach one correct label to each physical box.",
                  "Scan the box ID to open the box record.",
                  "Mark the box condition:"
                ]
              },
              {
                "type": "unordered",
                "items": [
                  "**Thumbs up:** good box.",
                  "**Thumbs down:** damaged box."
                ]
              },
              {
                "type": "ordered",
                "items": [
                  "For a damaged box, select/enter the damage reason and upload or capture a photograph.",
                  "Save the box details.",
                  "Repeat until all expected boxes are scanned.",
                  "Review the unloading summary and confirm good/damaged totals.",
                  "Upload the **Proof of Delivery (POD)**.",
                  "If an exception exists, add a clear reason.",
                  "Click **Complete/Mark Unloading Complete**.",
                  "Verify that the task shows all boxes completed."
                ]
              },
              {
                "type": "callout",
                "tone": "neutral",
                "icon": "\ud83d\udcf7",
                "items": [
                  {
                    "type": "text",
                    "text": "**Unloading Process Screenshots:**"
                  },
                  {
                    "type": "image",
                    "src": "/knowledge-base/img_008.webp"
                  },
                  {
                    "type": "image",
                    "src": "/knowledge-base/img_009.webp"
                  },
                  {
                    "type": "image",
                    "src": "/knowledge-base/img_010.webp"
                  }
                ]
              }
            ],
            "children": []
          },
          {
            "id": "exception-handling",
            "title": "Exception handling",
            "level": 3,
            "blocks": [
              {
                "type": "unordered",
                "items": [
                  "Damaged-box exceptions appear under the Inbound Exceptions area.",
                  "The warehouse manager can review the box, photo, and operator reason.",
                  "If a box was marked damaged incorrectly, the manager may mark it good by entering an override reason.",
                  "Operators should not override their own damage classification without manager review."
                ]
              }
            ],
            "children": []
          },
          {
            "id": "unloading-completion-checklist",
            "title": "Unloading completion checklist",
            "level": 3,
            "blocks": [
              {
                "type": "checklist",
                "items": [
                  "Correct task selected",
                  "All box labels printed and attached",
                  "Every box scanned",
                  "Damage status recorded accurately",
                  "Damage evidence and reason added where required",
                  "POD uploaded",
                  "Summary reviewed",
                  "Unloading completed successfully"
                ]
              }
            ],
            "children": []
          },
          {
            "id": "gate-exit-process",
            "title": "Gate Exit process",
            "level": 3,
            "blocks": [
              {
                "type": "ordered",
                "items": [
                  "Complete the unloading task and confirm that the vehicle has been fully unloaded.",
                  "Verify whether any other task is assigned to the same gate entry.",
                  "If another task is assigned, keep the gate entry and gate pass open until that task is completed.",
                  "If no other task is assigned, the vehicle can move from the unloading area towards the warehouse gate.",
                  "The guard at the gate\u2014the same role that created the gate entry\u2014opens the relevant gate-entry record.",
                  "The guard confirms the vehicle details and verifies that unloading is complete.",
                  "The guard performs **Gate Exit** and closes the gate pass/gate entry.",
                  "Confirm that the gate-entry status changes to **Closed** and allow the vehicle to exit."
                ]
              },
              {
                "type": "callout",
                "tone": "warning",
                "icon": "\u26a0\ufe0f",
                "items": [
                  {
                    "type": "text",
                    "text": "The gate pass can be closed only after the vehicle is fully unloaded and no other task remains assigned to the gate entry. Do not complete Gate Exit while unloading or another linked activity is still pending."
                  }
                ]
              }
            ],
            "children": []
          },
          {
            "id": "gate-exit-completion-checklist",
            "title": "Gate Exit completion checklist",
            "level": 3,
            "blocks": [
              {
                "type": "checklist",
                "items": [
                  "Vehicle fully unloaded",
                  "Unloading task completed",
                  "No other task assigned to the gate entry",
                  "Vehicle returned to the warehouse gate",
                  "Gate-entry and vehicle details verified by the guard",
                  "Gate Exit completed",
                  "Gate pass/gate entry status changed to Closed"
                ]
              }
            ],
            "children": []
          }
        ]
      },
      {
        "id": "3-qc-grn",
        "title": "3. QC / GRN",
        "level": 2,
        "blocks": [],
        "children": [
          {
            "id": "objective",
            "title": "Objective",
            "level": 3,
            "blocks": [
              {
                "type": "paragraph",
                "text": "Inspect item quality and quantity, capture batch information, separate grades, and raise receipt exceptions."
              }
            ],
            "children": []
          },
          {
            "id": "role-and-prerequisites",
            "title": "Role and prerequisites",
            "level": 3,
            "blocks": [
              {
                "type": "unordered",
                "items": [
                  "**Role:** QC operator",
                  "Unloading is complete.",
                  "QC task has auto-generated.",
                  "At least one free bin is available.",
                  "Good-grade and bad-grade bins are available when damaged inventory is expected."
                ]
              }
            ],
            "children": []
          },
          {
            "id": "step-by-step-procedure",
            "title": "Step-by-step procedure",
            "level": 3,
            "blocks": [
              {
                "type": "ordered",
                "items": [
                  "Open **Inbound \u2192 QC**.",
                  "In the **New** tab, locate the automatically generated task.",
                  "Click **Start QC**.",
                  "Select or scan a **Free Bin**.",
                  "Confirm that the selected bin is appropriate for good inventory; bins default to good grade.",
                  "Open each box and scan the SKU.",
                  "If batch and expiry tracking is enabled, enter:"
                ]
              },
              {
                "type": "unordered",
                "items": [
                  "Batch number",
                  "MRP",
                  "Expiry date",
                  "Manufacturing date, if configured"
                ]
              },
              {
                "type": "ordered",
                "items": [
                  "Enter or scan the accepted good quantity.",
                  "If damaged inventory is found:"
                ]
              },
              {
                "type": "unordered",
                "items": [
                  "Click **Change Bin**.",
                  "Select a bad-grade bin.",
                  "Scan the damaged quantity.",
                  "Select/enter the damage reason."
                ]
              },
              {
                "type": "ordered",
                "items": [
                  "Click **Change Bin** again before continuing with good inventory.",
                  "Continue until all physical stock is inspected.",
                  "Review expected, received, good, bad, short, and excess quantities.",
                  "Complete the task or raise the applicable exception."
                ]
              },
              {
                "type": "callout",
                "tone": "neutral",
                "icon": "\ud83d\udcf7",
                "items": [
                  {
                    "type": "text",
                    "text": "**Recommended screenshots:** New QC task; free-bin selection; batch/MRP/expiry form; Change Bin control; bad-grade reason; completed-item summary; excess/shortage exception summary."
                  }
                ]
              }
            ],
            "children": []
          },
          {
            "id": "excess-receipt",
            "title": "Excess receipt",
            "level": 3,
            "blocks": [
              {
                "type": "ordered",
                "items": [
                  "Scan the full physical quantity.",
                  "If received quantity exceeds the ASN quantity, review the excess shown in the summary.",
                  "Enter a clear reason.",
                  "Click **Confirm and Raise Exception**.",
                  "The manager/super admin reviews the exception and coordinates with the seller.",
                  "Follow the approved business process for excess inventory; do not silently adjust the count."
                ]
              }
            ],
            "children": []
          },
          {
            "id": "short-receipt",
            "title": "Short receipt",
            "level": 3,
            "blocks": [
              {
                "type": "ordered",
                "items": [
                  "Scan only the physical quantity received.",
                  "Complete pending QC and raise a shortage exception.",
                  "The manager reviews the expected versus received quantity and contacts the seller.",
                  "Put Away proceeds for the actual received quantity after review."
                ]
              },
              {
                "type": "callout",
                "tone": "warning",
                "icon": "\u26a0\ufe0f",
                "items": [
                  {
                    "type": "text",
                    "text": "Never enter the expected ASN quantity when fewer units were physically received. Record the actual quantity and use the exception workflow."
                  }
                ]
              }
            ],
            "children": []
          },
          {
            "id": "qc-completion-checklist",
            "title": "QC completion checklist",
            "level": 3,
            "blocks": [
              {
                "type": "checklist",
                "items": [
                  "Correct free bin selected",
                  "Every SKU scanned and inspected",
                  "Batch/MRP/expiry captured where configured",
                  "Good and bad quantities separated into appropriate bins",
                  "Damage reasons recorded",
                  "Expected vs. received quantities reviewed",
                  "Excess/shortage exception raised when needed",
                  "QC completed"
                ]
              }
            ],
            "children": []
          }
        ]
      },
      {
        "id": "4-put-away",
        "title": "4. Put Away",
        "level": 2,
        "blocks": [],
        "children": [
          {
            "id": "objective",
            "title": "Objective",
            "level": 3,
            "blocks": [
              {
                "type": "paragraph",
                "text": "Move QC-completed inventory into valid storage locations so it becomes available for downstream order processing."
              }
            ],
            "children": []
          },
          {
            "id": "put-away-modes",
            "title": "Put Away modes",
            "level": 3,
            "blocks": [
              {
                "type": "unordered",
                "items": [
                  "**Bin Put Away:** Move the entire QC bin to a location.",
                  "**Item Put Away:** Scan items individually from a source bin into destination bins/locations."
                ]
              }
            ],
            "children": []
          },
          {
            "id": "step-by-step-bin-put-away",
            "title": "Step-by-step: Bin Put Away",
            "level": 3,
            "blocks": [
              {
                "type": "ordered",
                "items": [
                  "Open **Inbound \u2192 Put Away**.",
                  "Locate the task in **New**.",
                  "Assign the task to the put-away operator, if required.",
                  "Click **Start Put Away**.",
                  "Select **Bin Put Away**.",
                  "Scan the QC source bin.",
                  "Scan/select the destination location.",
                  "Confirm that the location grade and storage type match the inventory.",
                  "Confirm the same bin as the destination bin when the entire QC bin is being placed at the location.",
                  "Confirm Put Away and complete the task."
                ]
              }
            ],
            "children": []
          },
          {
            "id": "step-by-step-item-put-away",
            "title": "Step-by-step: Item Put Away",
            "level": 3,
            "blocks": [
              {
                "type": "ordered",
                "items": [
                  "Open the Put Away task and select **Item Put Away**.",
                  "Scan the source QC bin.",
                  "Review the system-suggested destination location.",
                  "Scan the destination location and destination bin.",
                  "Scan each SKU/item to transfer it.",
                  "Monitor the processed quantity against the task quantity.",
                  "Repeat for each destination bin/location.",
                  "Store good inventory only in sellable/good locations.",
                  "Store bad inventory only in quarantine/bad locations.",
                  "Confirm each movement.",
                  "Complete the task and verify the **Completed** status."
                ]
              },
              {
                "type": "callout",
                "tone": "neutral",
                "icon": "\ud83d\udcf7",
                "items": [
                  {
                    "type": "text",
                    "text": "**Putaway process screenshots:**"
                  },
                  {
                    "type": "image",
                    "src": "/knowledge-base/img_011.webp"
                  },
                  {
                    "type": "image",
                    "src": "/knowledge-base/img_012.webp"
                  },
                  {
                    "type": "image",
                    "src": "/knowledge-base/img_013.webp"
                  },
                  {
                    "type": "image",
                    "src": "/knowledge-base/img_014.webp"
                  },
                  {
                    "type": "image",
                    "src": "/knowledge-base/img_015.webp"
                  },
                  {
                    "type": "image",
                    "src": "/knowledge-base/img_016.webp"
                  },
                  {
                    "type": "text",
                    "text": "**Complete bin putaway:**"
                  },
                  {
                    "type": "image",
                    "src": "/knowledge-base/img_017.webp"
                  },
                  {
                    "type": "image",
                    "src": "/knowledge-base/img_018.webp"
                  }
                ]
              }
            ],
            "children": []
          },
          {
            "id": "verify-inventory-after-put-away",
            "title": "Verify inventory after Put Away",
            "level": 3,
            "blocks": [
              {
                "type": "ordered",
                "items": [
                  "Open **Inventory Management \u2192 Detailed Inventory**.",
                  "Search for the SKU or task.",
                  "Verify:"
                ]
              },
              {
                "type": "unordered",
                "items": [
                  "SKU and client SKU code",
                  "Quantity",
                  "Batch and expiry",
                  "Location and bin",
                  "Grade",
                  "Available quantity",
                  "Blocked quantity",
                  "User who completed the movement"
                ]
              },
              {
                "type": "ordered",
                "items": [
                  "If the mapping is incorrect, stop further activity and escalate before orders consume the stock."
                ]
              },
              {
                "type": "callout",
                "tone": "neutral",
                "icon": "\ud83d\udcf7",
                "items": [
                  {
                    "type": "text",
                    "text": "**Detailed Inventory View:**"
                  },
                  {
                    "type": "image",
                    "src": "/knowledge-base/img_019.webp"
                  }
                ]
              }
            ],
            "children": []
          }
        ]
      }
    ]
  },
  {
    "id": "outbound-operations",
    "title": "Outbound Operations",
    "level": 1,
    "blocks": [],
    "children": [
      {
        "id": "1-orders",
        "title": "1. Orders",
        "level": 2,
        "blocks": [],
        "children": [
          {
            "id": "objective",
            "title": "Objective",
            "level": 3,
            "blocks": [
              {
                "type": "paragraph",
                "text": "Use the Orders screen to review outbound orders for the selected warehouse, understand their current processing stage, and narrow the list to records that require action."
              }
            ],
            "children": []
          },
          {
            "id": "open-the-orders-screen",
            "title": "Open the Orders screen",
            "level": 3,
            "blocks": [
              {
                "type": "ordered",
                "items": [
                  "Confirm that the correct warehouse is selected at the top of the screen.",
                  "From the left navigation, open **Order Management \u2192 Orders**.",
                  "Check the number of orders shown. This count updates when a status, search term, or filter is applied."
                ]
              }
            ],
            "children": []
          },
          {
            "id": "what-is-visible-on-the-orders-screen",
            "title": "What is visible on the Orders screen",
            "level": 3,
            "blocks": [
              {
                "type": "paragraph",
                "text": "The top of the screen groups orders by processing stage. Each tab shows the number of orders currently in that stage:"
              },
              {
                "type": "unordered",
                "items": [
                  "**All:** all orders available for the selected warehouse.",
                  "**New:** newly received orders that have not yet progressed to picking.",
                  "**Picked:** orders for which picking has been completed.",
                  "**Packed:** orders that have completed packing.",
                  "**RTS:** orders marked \u2018Ready to Ship\u2019.",
                  "**Completed:** orders that have completed the outbound workflow."
                ]
              },
              {
                "type": "paragraph",
                "text": "The order list displays the following information for each record:"
              },
              {
                "type": "unordered",
                "items": [
                  "**Order No:** the WMS order number.",
                  "**Ext Order No:** the external or channel order number.",
                  "**Order Type:** the configured order classification, such as B2C.",
                  "**Channel:** the source through which the order was created.",
                  "**Seller:** the seller associated with the order.",
                  "**Courier:** the assigned courier partner.",
                  "**SLA:** the applicable SLA date and time, with an ageing indicator where available.",
                  "**Payment Mode:** the payment method, such as Prepaid or COD.",
                  "**Status:** the order\u2019s current status.",
                  "**Total Quantity:** the total item quantity in the order.",
                  "**Created At:** the date and time when the order was created."
                ]
              },
              {
                "type": "callout",
                "tone": "neutral",
                "icon": "\ud83d\udcf7",
                "items": [
                  {
                    "type": "text",
                    "text": "**Orders screen \u2014 status tabs and order list:**"
                  },
                  {
                    "type": "image",
                    "src": "/knowledge-base/img_020.webp"
                  }
                ]
              },
              {
                "type": "callout",
                "tone": "info",
                "icon": "\ud83d\udca1",
                "items": [
                  {
                    "type": "text",
                    "text": "Use the stage tabs for a quick workflow-level view. Use search and More Filters when a more specific order set is required."
                  }
                ]
              }
            ],
            "children": []
          },
          {
            "id": "search-for-an-order",
            "title": "Search for an order",
            "level": 3,
            "blocks": [
              {
                "type": "paragraph",
                "text": "Use the search field to find an order by:"
              },
              {
                "type": "unordered",
                "items": [
                  "Order number",
                  "External order number",
                  "AWB",
                  "Client PO"
                ]
              },
              {
                "type": "paragraph",
                "text": "Enter the available identifier and use the search action to refresh the list."
              }
            ],
            "children": []
          },
          {
            "id": "apply-filters",
            "title": "Apply filters",
            "level": 3,
            "blocks": [
              {
                "type": "ordered",
                "items": [
                  "Click **More Filters** to open the Filter Orders panel.",
                  "Apply one or more of the following filters:"
                ]
              },
              {
                "type": "unordered",
                "items": [
                  "**Order Type:** show orders of a selected type.",
                  "**Seller:** restrict the list to a selected seller.",
                  "**Channel:** restrict the list to a source channel. Configured options may include Amazon, Flipkart, Manual, RTV, and Shopify.",
                  "**Courier:** show orders assigned to a selected courier.",
                  "**Payment Mode:** filter by the configured payment method.",
                  "**SLA:** filter orders by the applicable SLA category.",
                  "**Min Quantity:** show orders whose total quantity is at or above the entered value.",
                  "**Max Quantity:** show orders whose total quantity is at or below the entered value.",
                  "**Created From:** show orders created from the selected date onward."
                ]
              },
              {
                "type": "ordered",
                "items": [
                  "Click **Apply Filters**.",
                  "Review the updated order count and confirm that the displayed records match the intended criteria.",
                  "Click **Reset All** to clear the filter selections and return to the unfiltered list."
                ]
              },
              {
                "type": "callout",
                "tone": "neutral",
                "icon": "\ud83d\udcf7",
                "items": [
                  {
                    "type": "text",
                    "text": "**Filter Orders panel:**"
                  },
                  {
                    "type": "image",
                    "src": "/knowledge-base/img_021.webp"
                  }
                ]
              },
              {
                "type": "callout",
                "tone": "warning",
                "icon": "\u26a0\ufe0f",
                "items": [
                  {
                    "type": "text",
                    "text": "Status tabs, search, and detailed filters can narrow the list at the same time. If an expected order is not visible, clear the search and filters, verify the selected warehouse, and check the All tab."
                  }
                ]
              }
            ],
            "children": []
          },
          {
            "id": "orders-screen-review-checklist",
            "title": "Orders screen review checklist",
            "level": 3,
            "blocks": [
              {
                "type": "checklist",
                "items": [
                  "Correct warehouse selected",
                  "Appropriate status tab selected",
                  "Order count reviewed",
                  "Search identifier entered correctly, when used",
                  "Required filters applied",
                  "SLA, payment mode, status, and quantity reviewed",
                  "Filters reset before starting a new search, when required"
                ]
              }
            ],
            "children": []
          }
        ]
      },
      {
        "id": "2-picklist-creation-and-viewing",
        "title": "2. Picklist Creation and Viewing",
        "level": 2,
        "blocks": [],
        "children": [
          {
            "id": "objective",
            "title": "Objective",
            "level": 3,
            "blocks": [
              {
                "type": "paragraph",
                "text": "Create picklists from eligible outbound orders, monitor pick tasks, and view the SKU, storage location, bin, and quantity details required for picking."
              }
            ],
            "children": []
          },
          {
            "id": "create-a-picklist",
            "title": "Create a picklist",
            "level": 3,
            "blocks": [
              {
                "type": "ordered",
                "items": [
                  "From the left navigation, open **Order Management \u2192 Create Picklist**.",
                  "Confirm that the correct warehouse is selected.",
                  "Use the available filters to narrow the eligible order list:"
                ]
              },
              {
                "type": "unordered",
                "items": [
                  "**Seller**",
                  "**Courier**",
                  "**Sales Channel**",
                  "**Order Created At:** select a from-and-to date range.",
                  "**TAT Expiring By:** select the applicable time threshold.",
                  "**Payment Mode**",
                  "**Order Type**",
                  "**Order Quantity:** enter minimum and maximum quantities.",
                  "**Sale Amount Above (\u20b9)**",
                  "**No of SKUs:** enter the minimum and maximum number of SKUs."
                ]
              },
              {
                "type": "ordered",
                "items": [
                  "Click **Apply Filters**. Use **Reset** to clear the selections.",
                  "Review the resulting order table. Each row shows:"
                ]
              },
              {
                "type": "unordered",
                "items": [
                  "Order number",
                  "Seller",
                  "Courier",
                  "Status",
                  "Channel",
                  "Created date and time",
                  "SLA",
                  "Payment mode",
                  "Total quantity",
                  "Number of SKUs",
                  "Order amount"
                ]
              },
              {
                "type": "ordered",
                "items": [
                  "Select the required order or orders using the row checkboxes. Use the header checkbox only when all displayed orders should be selected.",
                  "Select the **Pick Type**:"
                ]
              },
              {
                "type": "unordered",
                "items": [
                  "**Order-wise Pick:** creates picking work based on the selected order.",
                  "**Split Picklist:** divides the picking work according to the configured split logic."
                ]
              },
              {
                "type": "ordered",
                "items": [
                  "Click **Create Picklist**.",
                  "Confirm that the success message appears and note whether the new pick task still needs assignment."
                ]
              },
              {
                "type": "callout",
                "tone": "neutral",
                "icon": "\ud83d\udcf7",
                "items": [
                  {
                    "type": "text",
                    "text": "**Picklist creation screen:**"
                  },
                  {
                    "type": "image",
                    "src": "/knowledge-base/img_022.webp"
                  },
                  {
                    "type": "text",
                    "text": "**Select orders and pick type:**"
                  },
                  {
                    "type": "image",
                    "src": "/knowledge-base/img_023.webp"
                  }
                ]
              },
              {
                "type": "callout",
                "tone": "warning",
                "icon": "\u26a0\ufe0f",
                "items": [
                  {
                    "type": "text",
                    "text": "Review the selected orders and pick type before creating the picklist. A successfully created picklist may still require a picker to be assigned before work can begin."
                  }
                ]
              }
            ],
            "children": []
          },
          {
            "id": "view-and-manage-picklists",
            "title": "View and manage picklists",
            "level": 3,
            "blocks": [
              {
                "type": "ordered",
                "items": [
                  "From the left navigation, open **Order Management \u2192 Pick**.",
                  "Use the status tabs to review pick tasks by stage:"
                ]
              },
              {
                "type": "unordered",
                "items": [
                  "**Open:** created tasks that have not started.",
                  "**In-progress:** tasks currently being picked.",
                  "**Complete:** completed pick tasks.",
                  "**Hold:** tasks temporarily placed on hold."
                ]
              },
              {
                "type": "ordered",
                "items": [
                  "Search by **Pick Task ID**, or narrow the list using **Seller**, **Assignee**, **Channel**, and **More Filters**.",
                  "Use **Auto-Assign Picklists** when pick tasks need to be assigned through the configured automatic assignment flow.",
                  "Review the picklist table. It displays:"
                ]
              },
              {
                "type": "unordered",
                "items": [
                  "Pick Task ID",
                  "Seller",
                  "Remaining quantity",
                  "Total quantity",
                  "Pick method",
                  "Created date and time",
                  "Time open",
                  "Assigned picker",
                  "Last updated date and time",
                  "Closed date and time, when completed"
                ]
              },
              {
                "type": "ordered",
                "items": [
                  "Click **View** in the Actions column to open a particular picklist."
                ]
              },
              {
                "type": "callout",
                "tone": "neutral",
                "icon": "\ud83d\udcf7",
                "items": [
                  {
                    "type": "text",
                    "text": "**Picking Management \u2014 picklist list:**"
                  },
                  {
                    "type": "image",
                    "src": "/knowledge-base/img_024.webp"
                  }
                ]
              }
            ],
            "children": []
          },
          {
            "id": "view-a-picklist-in-detail",
            "title": "View a picklist in detail",
            "level": 3,
            "blocks": [
              {
                "type": "paragraph",
                "text": "The detail screen shows the pick task number, current status, number of lines, picked units against total units, assigned picker, picker bin, expected units, and picked units. Under **View Picklist**, each line shows the inventory that needs to be picked:"
              },
              {
                "type": "unordered",
                "items": [
                  "**Status:** current state of the pick line.",
                  "**Storage Location:** warehouse location from which the inventory must be picked.",
                  "**Bin:** source bin containing the inventory.",
                  "**EAN:** barcode used to identify the SKU.",
                  "**Description:** SKU or item description.",
                  "**Expected Qty:** quantity that must be picked from that location and bin.",
                  "**Picked Qty:** quantity already picked.",
                  "**Remark:** exception or operational note, when available."
                ]
              },
              {
                "type": "paragraph",
                "text": "Open **Picked SKU Details** to review the SKU lines already processed for the task."
              },
              {
                "type": "callout",
                "tone": "neutral",
                "icon": "\ud83d\udcf7",
                "items": [
                  {
                    "type": "text",
                    "text": "**Picklist details \u2014 SKU, location, bin, and quantity:**"
                  },
                  {
                    "type": "image",
                    "src": "/knowledge-base/img_025.webp"
                  }
                ]
              },
              {
                "type": "callout",
                "tone": "info",
                "icon": "\ud83d\udca1",
                "items": [
                  {
                    "type": "text",
                    "text": "The same SKU can appear on separate lines when its inventory must be picked from different storage locations or bins. Follow each line\u2019s location, bin, and expected quantity rather than using only the total task quantity."
                  }
                ]
              }
            ],
            "children": []
          },
          {
            "id": "picklist-review-checklist",
            "title": "Picklist review checklist",
            "level": 3,
            "blocks": [
              {
                "type": "checklist",
                "items": [
                  "Correct warehouse selected",
                  "Eligible orders filtered and reviewed",
                  "Correct orders selected",
                  "Appropriate pick type selected",
                  "Picklist creation confirmed",
                  "Picker assignment checked",
                  "Correct pick task opened",
                  "Storage location and bin verified for every line",
                  "Expected and picked quantities compared",
                  "Pending lines or remarks reviewed"
                ]
              }
            ],
            "children": []
          }
        ]
      },
      {
        "id": "3-picking-flow",
        "title": "3. Picking Flow",
        "level": 2,
        "blocks": [],
        "children": [
          {
            "id": "objective",
            "title": "Objective",
            "level": 3,
            "blocks": [
              {
                "type": "paragraph",
                "text": "Complete an assigned pick task by linking a tote, validating each source location, scanning the required items, and confirming that the full picklist has been completed."
              }
            ],
            "children": []
          },
          {
            "id": "role-and-prerequisites",
            "title": "Role and prerequisites",
            "level": 3,
            "blocks": [
              {
                "type": "unordered",
                "items": [
                  "**Role:** Picker",
                  "The picklist has been created and assigned to the picker.",
                  "A free tote or picker bin with a readable barcode is available.",
                  "The scanner is connected and able to read location, bin, and item barcodes.",
                  "The picker is working in the warehouse selected for the task."
                ]
              }
            ],
            "children": []
          },
          {
            "id": "step-1-start-the-assigned-picklist",
            "title": "Step 1 \u2014 Start the assigned picklist",
            "level": 3,
            "blocks": [
              {
                "type": "ordered",
                "items": [
                  "Open the assigned pick task from the picking queue.",
                  "Start or enter the picking session.",
                  "Verify the pick task number before scanning.",
                  "Review the displayed source location, item, and **To Pick** quantity.",
                  "Keep the session open while moving through the warehouse; the elapsed time and task progress update on the screen."
                ]
              },
              {
                "type": "callout",
                "tone": "neutral",
                "icon": "\ud83d\udcf7",
                "items": [
                  {
                    "type": "text",
                    "text": "**Starting the picklist \u2014 active picking session:**"
                  },
                  {
                    "type": "image",
                    "src": "/knowledge-base/img_026.webp"
                  }
                ]
              }
            ],
            "children": []
          },
          {
            "id": "step-2-scan-a-tote-to-hold-the-picked-items",
            "title": "Step 2 \u2014 Scan a tote to hold the picked items",
            "level": 3,
            "blocks": [
              {
                "type": "ordered",
                "items": [
                  "At the **Scan Tote** prompt, scan the tote barcode.",
                  "Confirm the scan using **OK** when required.",
                  "Verify that the accepted tote appears as the **Picker Bin** at the top of the session.",
                  "Place all items for this pick task into the same assigned tote unless the system instructs otherwise."
                ]
              },
              {
                "type": "callout",
                "tone": "neutral",
                "icon": "\ud83d\udcf7",
                "items": [
                  {
                    "type": "text",
                    "text": "**Scanning the tote barcode:**"
                  },
                  {
                    "type": "image",
                    "src": "/knowledge-base/img_027.webp"
                  }
                ]
              }
            ],
            "children": []
          },
          {
            "id": "step-3-scan-the-first-from-location",
            "title": "Step 3 \u2014 Scan the first \u201cfrom location\u201d",
            "level": 3,
            "blocks": [
              {
                "type": "ordered",
                "items": [
                  "Read the location path displayed on the screen, including the zone, line, rack, and aisle.",
                  "Move to the indicated storage location.",
                  "At the **Scan Bin Location** prompt, scan the exact source bin barcode shown on the screen.",
                  "Confirm the scan. The item-scanning prompt appears only after the correct source has been validated."
                ]
              },
              {
                "type": "callout",
                "tone": "neutral",
                "icon": "\ud83d\udcf7",
                "items": [
                  {
                    "type": "text",
                    "text": "**Scanning the first source location:**"
                  },
                  {
                    "type": "image",
                    "src": "/knowledge-base/img_028.webp"
                  }
                ]
              }
            ],
            "children": []
          },
          {
            "id": "step-4-scan-items-from-the-validated-location",
            "title": "Step 4 \u2014 Scan items from the validated location",
            "level": 3,
            "blocks": [
              {
                "type": "ordered",
                "items": [
                  "Match the physical item with the image, description, and barcode shown on the screen.",
                  "Check the **To Pick** quantity.",
                  "Scan the item\u2019s EAN or SKU barcode once for each unit picked.",
                  "Place every successfully scanned unit into the assigned tote.",
                  "Monitor the **Picked** quantity and stop when it reaches the required quantity for that line.",
                  "If the item is missing or cannot be picked, use the applicable exception option instead of scanning a substitute item."
                ]
              },
              {
                "type": "callout",
                "tone": "neutral",
                "icon": "\ud83d\udcf7",
                "items": [
                  {
                    "type": "text",
                    "text": "**Scanning items from the first location:**"
                  },
                  {
                    "type": "image",
                    "src": "/knowledge-base/img_029.webp"
                  }
                ]
              }
            ],
            "children": []
          },
          {
            "id": "step-5-move-to-and-scan-another-location-when-required",
            "title": "Step 5 \u2014 Move to and scan another location, when required",
            "level": 3,
            "blocks": [
              {
                "type": "ordered",
                "items": [
                  "When the system displays another source location, keep the same assigned tote with the task.",
                  "Read the new zone, line, rack, aisle, and source-bin details.",
                  "Move to the new location.",
                  "Scan the new source bin at the **Scan Bin Location** prompt.",
                  "Do not scan the previous location again; each pick line must be completed against the source requested on the screen."
                ]
              },
              {
                "type": "callout",
                "tone": "neutral",
                "icon": "\ud83d\udcf7",
                "items": [
                  {
                    "type": "text",
                    "text": "**Scanning the next source location:**"
                  },
                  {
                    "type": "image",
                    "src": "/knowledge-base/img_030.webp"
                  }
                ]
              }
            ],
            "children": []
          },
          {
            "id": "step-6-scan-the-remaining-items-and-close-the-picklist",
            "title": "Step 6 \u2014 Scan the remaining items and close the picklist",
            "level": 3,
            "blocks": [
              {
                "type": "ordered",
                "items": [
                  "Verify the item and remaining **To Pick** quantity for the new location.",
                  "Scan each required unit and place it into the assigned tote.",
                  "Continue until the displayed picked quantity equals the required quantity for every line.",
                  "After the final valid scan, confirm that the system displays **Pick Complete** and a success message for the task.",
                  "Review the completion summary, including total units, total items, and the picked quantity for each item.",
                  "Click **Back to Picking** to return to the picking queue."
                ]
              },
              {
                "type": "callout",
                "tone": "neutral",
                "icon": "\ud83d\udcf7",
                "items": [
                  {
                    "type": "text",
                    "text": "**Scanning the final required items:**"
                  },
                  {
                    "type": "image",
                    "src": "/knowledge-base/img_031.webp"
                  },
                  {
                    "type": "text",
                    "text": "**Picklist completion confirmation:**"
                  },
                  {
                    "type": "image",
                    "src": "/knowledge-base/img_032.webp"
                  }
                ]
              },
              {
                "type": "callout",
                "tone": "success",
                "icon": "\u2705",
                "items": [
                  {
                    "type": "text",
                    "text": "A picklist is complete only when every required line reaches its expected quantity and the Pick Complete confirmation appears."
                  }
                ]
              }
            ],
            "children": []
          },
          {
            "id": "picking-completion-checklist",
            "title": "Picking completion checklist",
            "level": 3,
            "blocks": [
              {
                "type": "checklist",
                "items": [
                  "Correct assigned pick task started",
                  "Tote scanned and shown as the Picker Bin",
                  "First source location scanned successfully",
                  "Correct item and quantity picked from the first location",
                  "Additional source locations scanned when prompted",
                  "Every unit scanned before being placed in the tote",
                  "Picked quantity matched the required quantity for every line",
                  "Pick Complete confirmation reviewed",
                  "Completed tote retained for the next outbound stage"
                ]
              }
            ],
            "children": []
          }
        ]
      },
      {
        "id": "4-packing-flow",
        "title": "4. Packing Flow",
        "level": 2,
        "blocks": [],
        "children": [
          {
            "id": "objective",
            "title": "Objective",
            "level": 3,
            "blocks": [
              {
                "type": "paragraph",
                "text": "Validate the picked items against the order, record the packing session, capture the final package dimensions and weight, close the box, and move the order to Ready to Dispatch."
              }
            ],
            "children": []
          },
          {
            "id": "role-and-prerequisites",
            "title": "Role and prerequisites",
            "level": 3,
            "blocks": [
              {
                "type": "unordered",
                "items": [
                  "**Role:** Packer or configured Pick\u2013Pack operator",
                  "Picking is complete and the picked items are available in a tote.",
                  "The tote barcode is readable.",
                  "The packing station or table has a readable barcode.",
                  "The barcode scanner is connected.",
                  "A suitable box and packing material are available."
                ]
              }
            ],
            "children": []
          },
          {
            "id": "step-1-scan-and-link-the-packing-station",
            "title": "Step 1 \u2014 Scan and link the packing station",
            "level": 3,
            "blocks": [
              {
                "type": "ordered",
                "items": [
                  "After logging in, open **Order Management \u2192 Pack**.",
                  "Confirm that the correct warehouse is selected.",
                  "At the **Scan Pack Station** prompt, scan the barcode attached to the packing table or station.",
                  "Select **OK** if confirmation is required.",
                  "Verify that the station is accepted before opening a pack task.",
                  "Perform this step only once for the entire session in which the packer remains logged in. Do not scan the packing station again between orders unless the user logs out, the session resets, or the packer moves to another station."
                ]
              },
              {
                "type": "callout",
                "tone": "neutral",
                "icon": "\ud83d\udcf7",
                "items": [
                  {
                    "type": "text",
                    "text": "**Scan the packing table at the start of the logged-in session:**"
                  },
                  {
                    "type": "image",
                    "src": "/knowledge-base/img_033.webp"
                  }
                ]
              },
              {
                "type": "callout",
                "tone": "info",
                "icon": "\ud83d\udca1",
                "items": [
                  {
                    "type": "text",
                    "text": "The packing station remains linked for the packer\u2019s current logged-in session. Scan it again only after a new login/session or when changing packing stations."
                  }
                ]
              }
            ],
            "children": []
          },
          {
            "id": "step-2-open-the-pack-task-using-the-tote",
            "title": "Step 2 \u2014 Open the pack task using the tote",
            "level": 3,
            "blocks": [
              {
                "type": "ordered",
                "items": [
                  "Review the **To Pack**, **In Progress**, and **Hold** task counts.",
                  "At **Scan the tote barcode to open its pack session**, scan the tote used during picking.",
                  "Select **OK** if confirmation is required.",
                  "Verify that the correct order\u2019s packing session opens."
                ]
              },
              {
                "type": "callout",
                "tone": "neutral",
                "icon": "\ud83d\udcf7",
                "items": [
                  {
                    "type": "text",
                    "text": "**Open the packing session by scanning the tote:**"
                  },
                  {
                    "type": "image",
                    "src": "/knowledge-base/img_034.webp"
                  }
                ]
              }
            ],
            "children": []
          },
          {
            "id": "step-3-scan-and-validate-every-item",
            "title": "Step 3 \u2014 Scan and validate every item",
            "level": 3,
            "blocks": [
              {
                "type": "ordered",
                "items": [
                  "Verify the order number, order type, seller, courier, and packing table shown on the session.",
                  "Scan the item barcode in **Scan Item ID**. If permitted by the operating procedure, type the ID and submit it.",
                  "Match the scanned item with the displayed name, SKU, brand, category, MRP, weight, description, and item preview where available.",
                  "Place the validated item in the shipping box.",
                  "Repeat the scan for every required unit.",
                  "Monitor the progress count and percentage. Do not close the box until the required quantity is complete.",
                  "Use **Item View** to review item lines and **Box View** to review box-level details."
                ]
              },
              {
                "type": "callout",
                "tone": "neutral",
                "icon": "\ud83d\udcf7",
                "items": [
                  {
                    "type": "text",
                    "text": "**Scan the item ID and verify the order:**"
                  },
                  {
                    "type": "image",
                    "src": "/knowledge-base/img_035.webp"
                  }
                ]
              },
              {
                "type": "callout",
                "tone": "warning",
                "icon": "\u26a0\ufe0f",
                "items": [
                  {
                    "type": "text",
                    "text": "Do not pack an unscanned substitute item. If a barcode is rejected or the physical item does not match the order, stop and use the applicable exception or escalation process."
                  }
                ]
              }
            ],
            "children": []
          },
          {
            "id": "step-4-enter-package-details-and-close-the-box",
            "title": "Step 4 \u2014 Enter package details and close the box",
            "level": 3,
            "blocks": [
              {
                "type": "ordered",
                "items": [
                  "After the item progress reaches the required quantity, select **Close Box**.",
                  "Measure the sealed package and enter its dimensions in **Length \u00d7 Breadth \u00d7 Height**.",
                  "Select the correct dimension unit, such as centimetres.",
                  "Weigh the final package and enter the total weight.",
                  "Select the correct weight unit, such as kilograms.",
                  "Recheck all measurements, then select **Confirm & Close Box**."
                ]
              },
              {
                "type": "callout",
                "tone": "neutral",
                "icon": "\ud83d\udcf7",
                "items": [
                  {
                    "type": "text",
                    "text": "**Enter dimensions and weight before closing the box:**"
                  },
                  {
                    "type": "image",
                    "src": "/knowledge-base/img_036.webp"
                  }
                ]
              },
              {
                "type": "callout",
                "tone": "info",
                "icon": "\ud83d\udca1",
                "items": [
                  {
                    "type": "text",
                    "text": "Measure and weigh the final sealed package, including the box and packing material. Incorrect values can affect courier allocation, billing, and shipment processing."
                  }
                ]
              }
            ],
            "children": []
          },
          {
            "id": "step-5-review-the-closed-box-and-mark-the-order-packed",
            "title": "Step 5 \u2014 Review the closed box and mark the order packed",
            "level": 3,
            "blocks": [
              {
                "type": "ordered",
                "items": [
                  "Confirm that the **Box closed \u2014 order fully packed** message appears.",
                  "Verify that the progress count shows all required items completed.",
                  "Review the box details if needed before finalising the order.",
                  "Select **Mark Packed** to complete the packing operation."
                ]
              },
              {
                "type": "callout",
                "tone": "neutral",
                "icon": "\ud83d\udcf7",
                "items": [
                  {
                    "type": "text",
                    "text": "**Closed box ready to be marked packed:**"
                  },
                  {
                    "type": "image",
                    "src": "/knowledge-base/img_037.webp"
                  }
                ]
              }
            ],
            "children": []
          },
          {
            "id": "step-6-confirm-completion-and-continue",
            "title": "Step 6 \u2014 Confirm completion and continue",
            "level": 3,
            "blocks": [
              {
                "type": "ordered",
                "items": [
                  "Confirm that the **Order Packed!** message appears.",
                  "Verify that the message states that the order is now **Ready to Dispatch**.",
                  "To begin another task, scan the next tote barcode and select **OK**.",
                  "Otherwise, select **Back to Pack List**.",
                  "Retain the labelled package in the designated dispatch staging area for the next outbound stage."
                ]
              },
              {
                "type": "callout",
                "tone": "neutral",
                "icon": "\ud83d\udcf7",
                "items": [
                  {
                    "type": "text",
                    "text": "**Order packed and ready for dispatch:**"
                  },
                  {
                    "type": "image",
                    "src": "/knowledge-base/img_038.webp"
                  }
                ]
              },
              {
                "type": "callout",
                "tone": "success",
                "icon": "\u2705",
                "items": [
                  {
                    "type": "text",
                    "text": "Packing is complete only after every required item has been scanned, the box details have been confirmed, and the Order Packed confirmation appears."
                  }
                ]
              }
            ],
            "children": []
          },
          {
            "id": "packing-completion-checklist",
            "title": "Packing completion checklist",
            "level": 3,
            "blocks": [
              {
                "type": "checklist",
                "items": [
                  "Correct warehouse selected",
                  "Packing station scanned once for the current logged-in session",
                  "Correct tote scanned",
                  "Order and seller details verified",
                  "Every required item scanned and validated",
                  "Packing progress reached the required quantity",
                  "Final package dimensions entered correctly",
                  "Final package weight entered with the correct unit",
                  "Box closure confirmation reviewed",
                  "Order marked packed",
                  "Ready to Dispatch confirmation reviewed",
                  "Package moved to the dispatch staging area"
                ]
              }
            ],
            "children": []
          }
        ]
      }
    ]
  },
  {
    "id": "inventory-management",
    "title": "Inventory Management",
    "level": 1,
    "blocks": [],
    "children": [
      {
        "id": "1-location-and-bin-management",
        "title": "1. Location and Bin Management",
        "level": 2,
        "blocks": [],
        "children": [
          {
            "id": "create-bins",
            "title": "Create bins",
            "level": 3,
            "blocks": [
              {
                "type": "ordered",
                "items": [
                  "Open **Inventory Management \u2192 Bins**.",
                  "Click **Add Bin**.",
                  "Select the bin status and type:"
                ]
              },
              {
                "type": "unordered",
                "items": [
                  "Free / In Use / Maintenance",
                  "Plastic / Pallet"
                ]
              },
              {
                "type": "ordered",
                "items": [
                  "Select dimensions or configured box type.",
                  "Enter the number of bins to create.",
                  "Submit.",
                  "Print labels and attach them to the correct physical bins."
                ]
              }
            ],
            "children": []
          },
          {
            "id": "create-locations",
            "title": "Create locations",
            "level": 3,
            "blocks": [
              {
                "type": "ordered",
                "items": [
                  "Open **Inventory Management \u2192 Add Locations**.",
                  "Configure the naming structure:"
                ]
              },
              {
                "type": "unordered",
                "items": [
                  "Label",
                  "Prefix",
                  "Hierarchy level names",
                  "Counts for aisle/rack/shelf/bay",
                  "Separators such as hyphen or slash"
                ]
              },
              {
                "type": "ordered",
                "items": [
                  "Review the generated location preview.",
                  "Select the storage type:"
                ]
              },
              {
                "type": "unordered",
                "items": [
                  "Sellable",
                  "Quarantine",
                  "Receiving",
                  "Shipping",
                  "Cancel",
                  "Virtual"
                ]
              },
              {
                "type": "ordered",
                "items": [
                  "Select the grade permitted at the location.",
                  "Select the category:"
                ]
              },
              {
                "type": "unordered",
                "items": [
                  "Pick Line for loose-item picking",
                  "Bulk Line for stacked/bulk inventory"
                ]
              },
              {
                "type": "ordered",
                "items": [
                  "Configure reserve storage, subtype, seller, dimensions, and weight capacity as applicable.",
                  "Enable **Fixed Bin** to make the location itself a one-bin\u2013one-location storage bin. Once enabled, no movable bin can be placed at that location.",
                  "Generate, review, and save locations.",
                  "Print and attach location labels."
                ]
              },
              {
                "type": "callout",
                "tone": "danger",
                "icon": "\u26a0\ufe0f",
                "items": [
                  {
                    "type": "text",
                    "text": "A fixed bin creates a one-bin\u2013one-location storage setup: the location itself acts as the storage bin, so no movable bin can be placed on it. This is a one-time configuration and cannot be turned off; validate the location design before enabling it."
                  }
                ]
              },
              {
                "type": "callout",
                "tone": "neutral",
                "icon": "\ud83d\udcf7",
                "items": [
                  {
                    "type": "text",
                    "text": "**Create Locations \u2014 location hierarchy builder:**"
                  },
                  {
                    "type": "image",
                    "src": "/knowledge-base/img_039.webp"
                  },
                  {
                    "type": "text",
                    "text": "**Location Info**"
                  },
                  {
                    "type": "image",
                    "src": "/knowledge-base/img_040.webp"
                  }
                ]
              }
            ],
            "children": []
          }
        ]
      },
      {
        "id": "2-item-movement",
        "title": "2. Item Movement",
        "level": 2,
        "blocks": [],
        "children": [
          {
            "id": "objective",
            "title": "Objective",
            "level": 3,
            "blocks": [
              {
                "type": "paragraph",
                "text": "Create and execute a controlled task for moving a specified SKU quantity from one warehouse bin to another while keeping the physical inventory and WMS inventory mapping aligned."
              }
            ],
            "children": []
          },
          {
            "id": "roles-and-prerequisites",
            "title": "Roles and prerequisites",
            "level": 3,
            "blocks": [
              {
                "type": "unordered",
                "items": [
                  "**Supervisor:** creates the movement task and defines the source bin, destination bin, SKU, quantity, and reason.",
                  "**Operator:** performs the assigned movement by scanning the source bin, destination bin, and item, then confirms completion.",
                  "Inventory is available in the source bin.",
                  "The destination bin is valid for the item\u2019s storage type and grade.",
                  "Source-bin, destination-bin, and SKU barcodes are readable.",
                  "No active allocation or operational restriction blocks the inventory movement."
                ]
              }
            ],
            "children": []
          },
          {
            "id": "supervisor-flow-create-an-item-movement-task",
            "title": "Supervisor flow \u2014 Create an item movement task",
            "level": 3,
            "blocks": [],
            "children": [
              {
                "id": "step-1-open-task-creation",
                "title": "Step 1 \u2014 Open task creation",
                "level": 4,
                "blocks": [
                  {
                    "type": "ordered",
                    "items": [
                      "From the left navigation, open **Inventory Management \u2192 Item Movement**.",
                      "Click **New Task**.",
                      "Select the **Item Movement** tab.",
                      "Confirm that the correct warehouse is selected."
                    ]
                  },
                  {
                    "type": "callout",
                    "tone": "neutral",
                    "icon": "\ud83d\udcf7",
                    "items": [
                      {
                        "type": "text",
                        "text": "**Item Movement task-creation screen:**"
                      },
                      {
                        "type": "image",
                        "src": "/knowledge-base/img_041.webp"
                      }
                    ]
                  }
                ],
                "children": []
              },
              {
                "id": "step-2-define-the-movement",
                "title": "Step 2 \u2014 Define the movement",
                "level": 4,
                "blocks": [
                  {
                    "type": "ordered",
                    "items": [
                      "Select or scan the **From Bin** containing the inventory.",
                      "Select or scan the destination **To Bin**.",
                      "Select the SKU to be moved from the source bin.",
                      "Enter the movement quantity.",
                      "Select the applicable reason, such as a configured replenishment reason.",
                      "Verify that the source, destination, SKU, and quantity match the intended physical movement.",
                      "Click **Add Task**."
                    ]
                  },
                  {
                    "type": "callout",
                    "tone": "neutral",
                    "icon": "\ud83d\udcf7",
                    "items": [
                      {
                        "type": "text",
                        "text": "**Enter the source bin, destination bin, SKU, quantity, and reason:**"
                      },
                      {
                        "type": "image",
                        "src": "/knowledge-base/img_042.webp"
                      }
                    ]
                  },
                  {
                    "type": "callout",
                    "tone": "warning",
                    "icon": "\u26a0\ufe0f",
                    "items": [
                      {
                        "type": "text",
                        "text": "Do not create the task if the source inventory, destination grade, or requested quantity is incorrect. Correct the details before the operator begins movement."
                      }
                    ]
                  }
                ],
                "children": []
              },
              {
                "id": "step-3-review-the-created-task",
                "title": "Step 3 \u2014 Review the created task",
                "level": 4,
                "blocks": [
                  {
                    "type": "ordered",
                    "items": [
                      "Confirm that the task-created message appears.",
                      "Review the new row under **Created Tasks**.",
                      "Verify the task ID, movement type, source bin, destination bin, SKU, quantity, and reason.",
                      "Ensure that the task is available for assignment or execution by an operator."
                    ]
                  },
                  {
                    "type": "callout",
                    "tone": "neutral",
                    "icon": "\ud83d\udcf7",
                    "items": [
                      {
                        "type": "text",
                        "text": "**Review the newly created item movement task:**"
                      },
                      {
                        "type": "image",
                        "src": "/knowledge-base/img_043.webp"
                      }
                    ]
                  }
                ],
                "children": []
              }
            ]
          },
          {
            "id": "operator-flow-perform-the-item-movement",
            "title": "Operator flow \u2014 Perform the item movement",
            "level": 3,
            "blocks": [],
            "children": [
              {
                "id": "step-1-open-and-start-the-task",
                "title": "Step 1 \u2014 Open and start the task",
                "level": 4,
                "blocks": [
                  {
                    "type": "ordered",
                    "items": [
                      "Open **Inventory Management \u2192 Item Movement**.",
                      "Find the task under the applicable queue, such as **Pending**.",
                      "Verify the task ID and movement reason.",
                      "Assign the task to yourself if required, then start the task.",
                      "Confirm that the execution screen displays the expected source and destination bins."
                    ]
                  },
                  {
                    "type": "callout",
                    "tone": "neutral",
                    "icon": "\ud83d\udcf7",
                    "items": [
                      {
                        "type": "text",
                        "text": "**Open, assign, and start the pending movement task:**"
                      },
                      {
                        "type": "image",
                        "src": "/knowledge-base/img_044.webp"
                      }
                    ]
                  }
                ],
                "children": []
              },
              {
                "id": "step-2-scan-the-source-bin",
                "title": "Step 2 \u2014 Scan the source bin",
                "level": 4,
                "blocks": [
                  {
                    "type": "ordered",
                    "items": [
                      "Move to the source bin shown in the task.",
                      "Scan or enter the source-bin barcode.",
                      "Confirm that the system accepts the bin before removing inventory.",
                      "Do not take stock from another bin, even if the same SKU is available there."
                    ]
                  },
                  {
                    "type": "callout",
                    "tone": "neutral",
                    "icon": "\ud83d\udcf7",
                    "items": [
                      {
                        "type": "text",
                        "text": "**Scan the source bin:**"
                      },
                      {
                        "type": "image",
                        "src": "/knowledge-base/img_045.webp"
                      }
                    ]
                  }
                ],
                "children": []
              },
              {
                "id": "step-3-scan-the-destination-bin",
                "title": "Step 3 \u2014 Scan the destination bin",
                "level": 4,
                "blocks": [
                  {
                    "type": "ordered",
                    "items": [
                      "Carry the selected inventory to the destination shown in the task.",
                      "Scan or enter the destination-bin barcode.",
                      "Confirm that the accepted destination matches the task.",
                      "Keep the items separate from other inventory until the movement is confirmed."
                    ]
                  },
                  {
                    "type": "callout",
                    "tone": "neutral",
                    "icon": "\ud83d\udcf7",
                    "items": [
                      {
                        "type": "text",
                        "text": "**Scan the destination bin:**"
                      },
                      {
                        "type": "image",
                        "src": "/knowledge-base/img_046.webp"
                      }
                    ]
                  }
                ],
                "children": []
              },
              {
                "id": "step-4-scan-the-item-and-confirm-quantity",
                "title": "Step 4 \u2014 Scan the item and confirm quantity",
                "level": 4,
                "blocks": [
                  {
                    "type": "ordered",
                    "items": [
                      "Scan or enter the item\u2019s SKU/EAN.",
                      "Match the displayed item details with the physical inventory.",
                      "Enter or scan the quantity physically moved.",
                      "Compare the processed quantity with the expected quantity shown on the task.",
                      "Click **Confirm Movement** only after the item, quantity, source bin, and destination bin are correct."
                    ]
                  },
                  {
                    "type": "callout",
                    "tone": "neutral",
                    "icon": "\ud83d\udcf7",
                    "items": [
                      {
                        "type": "text",
                        "text": "**Scan the item, verify the quantity, and confirm movement:**"
                      },
                      {
                        "type": "image",
                        "src": "/knowledge-base/img_047.webp"
                      }
                    ]
                  }
                ],
                "children": []
              },
              {
                "id": "step-5-verify-task-completion",
                "title": "Step 5 \u2014 Verify task completion",
                "level": 4,
                "blocks": [
                  {
                    "type": "ordered",
                    "items": [
                      "Confirm that the movement-success message appears.",
                      "Open the **Completed** tab.",
                      "Verify that the task shows a completed status.",
                      "Check Detailed Inventory when required to confirm that the SKU quantity is mapped to the destination bin."
                    ]
                  },
                  {
                    "type": "callout",
                    "tone": "neutral",
                    "icon": "\ud83d\udcf7",
                    "items": [
                      {
                        "type": "text",
                        "text": "**Completed item movement task:**"
                      },
                      {
                        "type": "image",
                        "src": "/knowledge-base/img_048.webp"
                      }
                    ]
                  },
                  {
                    "type": "callout",
                    "tone": "success",
                    "icon": "\u2705",
                    "items": [
                      {
                        "type": "text",
                        "text": "The movement is complete only when the physical stock is in the destination bin and the task shows Completed in WMS."
                      }
                    ]
                  }
                ],
                "children": []
              }
            ]
          },
          {
            "id": "item-movement-completion-checklist",
            "title": "Item Movement completion checklist",
            "level": 3,
            "blocks": [
              {
                "type": "checklist",
                "items": [
                  "Correct warehouse selected",
                  "Correct source and destination bins selected",
                  "SKU and movement quantity verified by the supervisor",
                  "Movement reason selected",
                  "Task created successfully",
                  "Correct task opened by the operator",
                  "Source bin scanned and accepted",
                  "Destination bin scanned and accepted",
                  "Correct SKU and physical quantity moved",
                  "Movement confirmation displayed",
                  "Task status changed to Completed",
                  "Detailed Inventory checked when reconciliation is required"
                ]
              }
            ],
            "children": []
          }
        ]
      }
    ]
  },
  {
    "id": "returns",
    "title": "Returns",
    "level": 1,
    "blocks": [
      {
        "type": "callout",
        "tone": "neutral",
        "icon": "\ud83d\udcdd",
        "items": [
          {
            "type": "text",
            "text": "Content for returns processes will be added later."
          }
        ]
      }
    ],
    "children": []
  },
  {
    "id": "reports",
    "title": "Reports",
    "level": 1,
    "blocks": [],
    "children": [
      {
        "id": "report-generation-and-audit-verification",
        "title": "Report generation and audit verification",
        "level": 2,
        "blocks": [
          {
            "type": "ordered",
            "items": [
              "Open **Reports**.",
              "Select the report type:"
            ]
          },
          {
            "type": "unordered",
            "items": [
              "ASN",
              "Gate Entry",
              "GRN/QC",
              "Inventory Snapshot",
              "Inventory History",
              "Detailed Inventory"
            ]
          },
          {
            "type": "ordered",
            "items": [
              "Select warehouse, seller, locations, and date range as applicable.",
              "Click **Generate Report**.",
              "Open **Job History** and wait for completion.",
              "Download the report or retrieve it from email, if configured.",
              "Verify record count and filters before sharing or using the report for reconciliation."
            ]
          },
          {
            "type": "callout",
            "tone": "neutral",
            "icon": "\ud83d\udcf7",
            "items": [
              {
                "type": "text",
                "text": "**Report generation:**"
              },
              {
                "type": "image",
                "src": "/knowledge-base/img_049.webp"
              },
              {
                "type": "image",
                "src": "/knowledge-base/img_050.webp"
              },
              {
                "type": "text",
                "text": "**Job history:**"
              },
              {
                "type": "image",
                "src": "/knowledge-base/img_051.webp"
              }
            ]
          }
        ],
        "children": []
      }
    ]
  },
  {
    "id": "troubleshooting",
    "title": "Troubleshooting",
    "level": 1,
    "blocks": [],
    "children": [
      {
        "id": "inventory-incorrectly-mapped-to-one-bin",
        "title": "Inventory incorrectly mapped to one bin",
        "level": 2,
        "blocks": [
          {
            "type": "ordered",
            "items": [
              "Stop additional incorrect Put Away activity.",
              "Identify physical stock and compare it with Detailed Inventory.",
              "Request/confirm Item Movement availability for Dark Store.",
              "Perform movement when no active order allocation is blocking the source bin.",
              "If movement is unavailable, obtain approval to use RTV followed by correct re-inward.",
              "Reconcile system and physical quantities after correction."
            ]
          }
        ],
        "children": []
      },
      {
        "id": "scanner-does-not-work-in-wms",
        "title": "Scanner does not work in WMS",
        "level": 2,
        "blocks": [
          {
            "type": "ordered",
            "items": [
              "Confirm the same device scans successfully in another application.",
              "Capture the affected picklist/pick-task number and a screenshot.",
              "Compare the device\u2019s scanner configuration with a working warehouse device.",
              "Correct the device configuration with support.",
              "Test location, SKU, and tote barcode scans before resuming operations.",
              "Avoid prolonged manual typing because it increases mismatch risk."
            ]
          }
        ],
        "children": []
      },
      {
        "id": "final-operator-rule",
        "title": "Final operator rule",
        "level": 2,
        "blocks": [
          {
            "type": "callout",
            "tone": "success",
            "icon": "\u2705",
            "items": [
              {
                "type": "text",
                "text": "At every stage, the WMS record must match the physical stock, physical box, selected bin, and selected location. When they differ, stop, document the mismatch, and use the exception or escalation process before continuing."
              }
            ]
          }
        ],
        "children": []
      }
    ]
  },
  {
    "id": "glossary",
    "title": "Glossary",
    "level": 1,
    "blocks": [
      {
        "type": "callout",
        "tone": "neutral",
        "icon": "\ud83d\udcdd",
        "items": [
          {
            "type": "text",
            "text": "WMS terms and abbreviations will be added later."
          }
        ]
      }
    ],
    "children": []
  }
];
