import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { DeviceCategory, DiagnosisResult, ChatMessage } from "../types";
import { supabaseService } from "./supabaseService";

function getAI() {
  return new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
}

export async function runForensicAudit(
  category: DeviceCategory,
  description: string,
  images: string[],
  location?: { latitude: number; longitude: number },
  manualDeviceName?: string
): Promise<DiagnosisResult> {
  const ai = getAI();

  const currentDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const locationContext = location
    ? `The user is currently located at coordinates: ${location.latitude}, ${location.longitude}.
       IMPORTANT: IDENTIFY the user's country from these coordinates.
       1. Identify the local currency and set 'currency_code' accordingly.
       2. Use this country to find LOCAL hardware/tool retailers (e.g., if in Ghana, look for Franko Trading or local markets).`
    : "The user's location is unknown; default to USD and global retailers (Amazon, eBay).";

  let prompt = `TITAN FORENSIC PROTOCOL: Execute analysis on hardware component.

    PRIMARY CONTEXT:
    Current Date: ${currentDate} (Use this to identify latest releases like iPhone 17, Galaxy S25, etc.)
    Category: ${category}
    User Description: ${description}
    ${locationContext}
  `;

  if (manualDeviceName) {
    prompt += `
    USER CLAIM: The user states this is a "${manualDeviceName}".
    TASK: VERIFY if the visual evidence supports this claim.
    - If it looks correct, use the standardized ${manualDeviceName} brand/model.
    - If it is CLEARLY different (e.g. user says iPhone but image is Samsung), correct it.
    `;
  }

  prompt += `
    HYPER-ACCURATE IDENTIFICATION MANDATE (CRITICAL - ZERO TOLERANCE FOR MISIDENTIFICATION):
    1. FORENSIC SCRUTINY: Analyze EVERY pixel for:
       - Serial numbers, IMEI, model numbers (back/SIM tray)
       - FCC IDs, regulatory markings (CE, IC)
       - Port type (USB-C vs Lightning), headphone jack presence
       - Camera module: lens count, flash position, LiDAR sensor
       - Buttons: volume, power, action button, mute switch location
       - Screen: notch size/shape, Dynamic Island, hole-punch, bezels
       - Materials: matte, glossy, frosted glass, aluminum, titanium
       - Exact color (e.g., "Starlight", "Midnight", "Deep Purple")

    2. MODEL-SPECIFIC FEATURES (MANDATORY):
       - CHECK RELEASE DATES: Use Google Search to verify if the device matches the LATEST models released up to ${currentDate}.
       - iPhone 14/15/16/17 Series: Distinguish via Dynamic Island, Action Button, Camera Control Button (iPhone 16+), and lens layout.
       - Pixel 8/9/10 Series: Check camera bar evolution.
       - Samsung S24/S25/S26: Check camera ring separation and bezel thickness.

    3. CONFIDENCE SCORING: If angle/lighting prevents precise ID, set confidence <70% and state uncertainty in 'reasoning'.

    4. BRAND AUTHENTICITY: Distinguish genuine vs knock-off variants.

    SPECIALIST SEARCH MANDATE:
    1. Use Google Search to find REAL, ACTIVE local electronic repair specialists near the user's coordinates.
    2. LINK STABILITY: For the 'uri' property, ONLY provide a direct Google Maps search link in the format:
       https://www.google.com/maps/search/?api=1&query=[Encoded+Shop+Name+Location]

    DIY SEARCH MANDATE:
    1. STABLE SEARCH STRATEGY: Provide TWO STABLE YouTube search URLs in the 'diy_guides' array:
       - Link 1 Title: "[Device] [Issue] Diagnostic Search" -> URI: https://www.youtube.com/results?search_query=[Encoded+Device]+[Encoded+Issue]
       - Link 2 Title: "[Device] [Repair] Step-by-Step" -> URI: https://www.youtube.com/results?search_query=[Encoded+Device]+[Encoded+Action]+replacement+repair
    2. ZERO FRAGILE LINKS: OMIT direct links to articles or videos that might be deleted. Search queries are the only stable path.

    MARKET & TOOL LOCALIZATION MANDATE:
    1. SEARCH-ONLY URLS: For tools and parts, NEVER provide direct product links. Use search URLs:
       - Amazon: https://www.amazon.com/s?k=[Encoded+Query]
       - AliExpress: https://www.aliexpress.com/wholesale?SearchText=[Encoded+Query]
       - eBay: https://www.ebay.com/sch/i.html?_nkw=[Encoded+Query]
       - Local (e.g. Ghana): https://jiji.com.gh/search?query=[Encoded+Query]
    2. Each item in 'required_tools' and 'parts_retailers' must have its own unique search link.
    3. SOURCING: Match tools to global search (Amazon/AliExpress) and parts to a mix of global and local search.
    4. OMIT: If you cannot identify a tool or part with confidence, omit it.

    INTELLIGENT VALIDATION MANDATE:
    1. CATEGORY CHECK: Compare the user-provided 'Category' (${category}) with the actual identified device.
    2. MISMATCH DETECTION: If the user's selection does not match the true device, set 'category_mismatch' to true and 'identified_category' to the correct category. Otherwise set 'category_mismatch' to false.
    3. NO-ISSUE DETECTION: If the device appears pristine with NO visible damage AND the user description is empty or vague, set 'no_visible_issue' to true. Otherwise set it to false.

    Provide the result in the specified JSON schema.`;

  const model = ai.getGenerativeModel({
    model: "gemini-1.5-flash",
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: SchemaType.OBJECT,
        properties: {
          brand: { type: SchemaType.STRING },
          model: { type: SchemaType.STRING },
          confidence_score: { type: SchemaType.NUMBER },
          risk_level: { type: SchemaType.STRING },
          is_high_voltage: { type: SchemaType.BOOLEAN },
          recommended_action: { type: SchemaType.STRING },
          reasoning: { type: SchemaType.STRING },
          potential_fix_cost_estimate: { type: SchemaType.STRING },
          currency_code: { type: SchemaType.STRING },
          resale_value: {
            type: SchemaType.OBJECT,
            properties: {
              unit_value_fixed: { type: SchemaType.STRING },
              unit_value_broken: { type: SchemaType.STRING },
              profit_potential: { type: SchemaType.STRING }
            },
            required: ["unit_value_fixed", "unit_value_broken", "profit_potential"]
          },
          recommended_repair_hubs: {
            type: SchemaType.ARRAY,
            items: {
              type: SchemaType.OBJECT,
              properties: {
                name: { type: SchemaType.STRING },
                address: { type: SchemaType.STRING },
                uri: { type: SchemaType.STRING },
                rating: { type: SchemaType.STRING },
                specialty: { type: SchemaType.STRING }
              },
              required: ["name", "address", "uri"]
            }
          },
          diy_guides: {
            type: SchemaType.ARRAY,
            items: {
              type: SchemaType.OBJECT,
              properties: {
                title: { type: SchemaType.STRING },
                uri: { type: SchemaType.STRING },
                author: { type: SchemaType.STRING },
                platform: { type: SchemaType.STRING },
                duration: { type: SchemaType.STRING },
                difficulty: { type: SchemaType.STRING }
              },
              required: ["title", "uri", "platform", "difficulty"]
            }
          },
          required_tools: {
            type: SchemaType.ARRAY,
            items: {
              type: SchemaType.OBJECT,
              properties: {
                name: { type: SchemaType.STRING },
                reason: { type: SchemaType.STRING },
                link: { type: SchemaType.STRING }
              },
              required: ["name", "reason"]
            }
          },
          purchase_options: {
            type: SchemaType.ARRAY,
            items: {
              type: SchemaType.OBJECT,
              properties: {
                name: { type: SchemaType.STRING },
                price: { type: SchemaType.STRING },
                uri: { type: SchemaType.STRING },
                is_new: { type: SchemaType.BOOLEAN }
              },
              required: ["name", "price", "uri", "is_new"]
            }
          },
          parts_retailers: {
            type: SchemaType.ARRAY,
            items: {
              type: SchemaType.OBJECT,
              properties: {
                name: { type: SchemaType.STRING },
                part_name: { type: SchemaType.STRING },
                uri: { type: SchemaType.STRING }
              },
              required: ["name", "part_name", "uri"]
            }
          },
          category_mismatch: { type: SchemaType.BOOLEAN },
          identified_category: { type: SchemaType.STRING },
          no_visible_issue: { type: SchemaType.BOOLEAN }
        },
        required: ["brand", "model", "confidence_score", "risk_level", "recommended_action", "resale_value", "recommended_repair_hubs", "diy_guides", "required_tools", "purchase_options", "parts_retailers", "category_mismatch", "identified_category", "no_visible_issue"]
      }
    }
  });

  try {
    const response = await model.generateContent([
      prompt,
      ...images.map(img => ({
        inlineData: { mimeType: "image/jpeg", data: img.split(',')[1] }
      }))
    ]);

    const text = response.response.text();
    const sources = response.response.candidates?.[0]?.groundingMetadata?.groundingChunks
      ?.map(chunk => chunk.web?.uri)
      .filter((uri): uri is string => !!uri) || [];

    const result = JSON.parse(text) as DiagnosisResult;

    // Augment with verified specs from DB if available
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const specs = await supabaseService.getDeviceSpecs(result.brand, result.model) as any;
      if (specs) {
        (result as unknown as Record<string, unknown>).technical_specs = {
          processor: `${specs.processor_brand} ${specs.num_cores} Cores`,
          screen: `${specs.screen_size}" @ ${specs.refresh_rate}Hz`,
          battery: `${specs.battery_capacity} mAh`,
          camera: `${specs.num_rear_cameras} Rear / ${specs.primary_camera_front}MP Front`,
          os: specs.os
        };
      }
    } catch {
      // DB augmentation is optional — proceed with AI result only
    }

    // Ensure all repair hub URIs are valid Google Maps search links
    if (result.recommended_repair_hubs) {
      result.recommended_repair_hubs = result.recommended_repair_hubs.map(hub => {
        if (!hub.uri || !hub.uri.includes('google.com/maps') || hub.uri.includes('placeholder')) {
          const query = encodeURIComponent(`${hub.name} ${hub.address}`);
          hub.uri = `https://www.google.com/maps/search/?api=1&query=${query}`;
        }
        return hub;
      });
    }

    result.sources = sources;
    return result;

  } catch (err: unknown) {
    console.error("TITAN_AUDIT_ERROR:", err);
    throw new Error(String(err));
  }
}

export async function chatWithAssistant(message: string): Promise<ChatMessage> {
  const ai = getAI();
  const model = ai.getGenerativeModel({
    model: 'gemini-1.5-flash',
    systemInstruction: 'You are TITAN Support, an expert hardware diagnostics assistant. Be technical, precise, and helpful. Use search to verify current hardware trends and pricing.',
  });

  const response = await model.generateContent(message);

  const sources = response.response.candidates?.[0]?.groundingMetadata?.groundingChunks
    ?.map(chunk => chunk.web?.uri)
    .filter((uri): uri is string => !!uri) || [];

  return {
    role: 'ai',
    text: response.response.text() || "Unable to get a response. Please try again.",
    sources
  };
}
