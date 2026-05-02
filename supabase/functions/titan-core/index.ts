
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { GoogleGenerativeAI, SchemaType } from "npm:@google/generative-ai@^0.24.1";
import { createClient } from "npm:@supabase/supabase-js@^2.39.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { category, description, images, location } = await req.json();

    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
    const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') || '';

    if (!GEMINI_API_KEY) {
      return new Response(JSON.stringify({ error: 'GEMINI_API_KEY is not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const currentDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    const locationContext = location
      ? `The user is at coordinates: ${location.latitude}, ${location.longitude}. Identify the country, use local currency, and find LOCAL repair specialists and retailers.`
      : "Location unknown; default to USD and global retailers (Amazon, eBay).";

    const prompt = `TITAN FORENSIC PROTOCOL: Execute analysis on hardware component.

      PRIMARY CONTEXT:
      Current Date: ${currentDate}
      Category: ${category}
      User Description: ${description}
      ${locationContext}

      HYPER-ACCURATE IDENTIFICATION MANDATE:
      1. Analyze EVERY pixel: serial numbers, model markings, port types, camera modules, buttons, screen shape, materials.
      2. Distinguish between latest models using release dates up to ${currentDate}.
      3. Identify genuine vs knock-offs.

      SPECIALIST SEARCH MANDATE:
      - Find REAL, ACTIVE local electronic repair specialists near the coordinates.
      - For 'uri', ONLY use Google Maps search: https://www.google.com/maps/search/?api=1&query=[Encoded+Name+Location]

      DIY SEARCH MANDATE:
      - Provide TWO stable YouTube search URLs for diagnosis and step-by-step repair.

      MARKET & TOOL LOCALIZATION:
      - Use search-only URLs: Amazon, AliExpress, eBay, and local platforms.
      - Each tool and part must have its own search link.

      INTELLIGENT VALIDATION:
      - Detect category mismatch between user-selected and actual device type.
      - Detect "no visible issue" when device appears pristine and description is vague.

      Provide the result in the specified JSON schema.`;

    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
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
                  platform: { type: SchemaType.STRING },
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
            common_failures: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
            no_visible_issue: { type: SchemaType.BOOLEAN }
          },
          required: ["brand", "model", "confidence_score", "risk_level", "recommended_action", "resale_value", "recommended_repair_hubs", "diy_guides", "required_tools", "purchase_options", "parts_retailers", "category_mismatch", "identified_category", "no_visible_issue"]
        }
      }
    });

    const result = await model.generateContent([
      prompt,
      ...images.map((img: string) => ({
        inlineData: { mimeType: "image/jpeg", data: img.split(',')[1] }
      }))
    ]);

    const diagnosisResult = JSON.parse(result.response.text());

    // Augment with device specs from database
    if (SUPABASE_URL && SUPABASE_ANON_KEY) {
      try {
        const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        const { data: specs } = await supabase
          .from('device_specs')
          .select('*')
          .ilike('brand_name', `%${diagnosisResult.brand}%`)
          .ilike('model_name', `%${diagnosisResult.model}%`)
          .limit(1)
          .maybeSingle();

        if (specs) {
          diagnosisResult.technical_specs = {
            processor: `${specs.processor_brand} ${specs.num_cores} Cores`,
            screen: `${specs.screen_size}" @ ${specs.refresh_rate}Hz`,
            battery: `${specs.battery_capacity} mAh`,
            camera: `${specs.num_rear_cameras} Rear / ${specs.primary_camera_front}MP Front`,
            os: specs.os,
          };
          if (specs.model_name && specs.model_name.length > diagnosisResult.model.length) {
            diagnosisResult.model = specs.model_name;
          }
        }
      } catch {
        // DB augmentation is optional
      }
    }

    // Ensure all repair hub URIs are valid Google Maps search links
    if (diagnosisResult.recommended_repair_hubs) {
      diagnosisResult.recommended_repair_hubs = diagnosisResult.recommended_repair_hubs.map(
        (hub: { name: string; address: string; uri: string }) => {
          if (!hub.uri || !hub.uri.includes('google.com/maps') || hub.uri.includes('placeholder')) {
            const query = encodeURIComponent(`${hub.name} ${hub.address}`);
            hub.uri = `https://www.google.com/maps/search/?api=1&query=${query}`;
          }
          return hub;
        }
      );
    }

    return new Response(JSON.stringify(diagnosisResult), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
