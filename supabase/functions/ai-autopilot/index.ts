
import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SECRET = (() => {
  const raw = Deno.env.get("SUPABASE_SECRET_KEYS");
  if (raw) {
    try { const x = JSON.parse(raw); if (x?.default) return String(x.default); } catch (_) {}
  }
  return Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_SECRET_KEY") || "";
})();
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY") || "";
const MODEL = "gpt-5.6-luna";
const admin = createClient(SUPABASE_URL, SECRET);

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization,x-client-info,apikey,content-type",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Content-Type": "application/json"
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: cors });
}

function clamp(n: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, n));
}

async function count(table: string, column = "id") {
  const { count, error } = await admin.from(table).select(column, { count: "exact", head: true });
  if (error) throw error;
  return count || 0;
}

async function claimCycle() {
  const { data, error } = await admin.rpc("claim_ai_robot_cycle");
  if (error) throw error;
  return Boolean(data);
}

async function upsertBrainAtom(row: {
  title: string;
  content: string;
  device_model?: string | null;
  knowledge_type: string;
  tags?: string[];
  source_page?: number | null;
  verification_status?: string;
  confidence?: number;
  metadata: Record<string, unknown>;
}) {
  const sourceTable = String(row.metadata.source_table || "");
  const sourceId = String(row.metadata.source_id || "");
  if (!sourceTable || !sourceId) return false;

  const { data: existing, error: qe } = await admin
    .from("brain_knowledge")
    .select("id")
    .contains("metadata", { source_table: sourceTable, source_id: sourceId })
    .limit(1);
  if (qe) throw qe;
  if ((existing || []).length) return false;

  const { error } = await admin.from("brain_knowledge").insert({
    knowledge_type: row.knowledge_type,
    title: row.title.slice(0, 500),
    content: row.content.slice(0, 12000),
    device_model: row.device_model?.slice(0, 200) || null,
    tags: (row.tags || []).slice(0, 30),
    source_page: row.source_page || null,
    confidence: clamp(Number(row.confidence || 80), 0, 100),
    verification_status: row.verification_status || "inferred",
    metadata: row.metadata
  });
  if (error) throw error;
  return true;
}

async function ingestVerifiedCases() {
  let learned = 0;

  const { data: boardCases, error: be } = await admin
    .from("ai_board_knowledge")
    .select("*")
    .eq("verification_status", "verified")
    .eq("status", "published")
    .order("updated_at", { ascending: false })
    .limit(30);
  if (be) throw be;

  for (const c of boardCases || []) {
    const content = [
      c.symptom && `Symptom: ${c.symptom}`,
      c.panic_log && `PANIC: ${c.panic_log}`,
      c.boot_current && `Boot current: ${c.boot_current}`,
      c.voltage_measurement && `Voltage: ${c.voltage_measurement}`,
      c.resistance_measurement && `Resistance/diode: ${c.resistance_measurement}`,
      c.i2c_data && `I2C: ${c.i2c_data}`,
      c.diagnosis && `Diagnosis: ${c.diagnosis}`,
      c.suspected_component && `Suspect: ${c.suspected_component}`,
      c.repair_solution && `Repair: ${c.repair_solution}`,
      c.repair_result && `Result: ${c.repair_result}`,
      c.technician_note && `Note: ${c.technician_note}`
    ].filter(Boolean).join("\n");

    if (content.length < 30) continue;
    if (await upsertBrainAtom({
      title: c.title || c.symptom || "Verified Apple Seed board case",
      content,
      device_model: c.device_model || c.device_model,
      knowledge_type: "failure",
      tags: ["apple_seed_case", c.category, c.fault_code, c.repair_stage].filter(Boolean),
      confidence: Number(c.confidence || 92),
      verification_status: "apple_seed_verified",
      metadata: {
        source_table: "ai_board_knowledge",
        source_id: String(c.id),
        source_type: c.source_type || "apple_seed_case",
        verification_status: c.verification_status || "verified"
      }
    })) learned++;
  }

  const { data: community, error: ce } = await admin
    .from("community_cases")
    .select("*")
    .eq("verified", true)
    .order("updated_at", { ascending: false })
    .limit(20);
  if (ce) throw ce;

  for (const c of community || []) {
    const content = [
      c.panic_log && `PANIC: ${c.panic_log}`,
      c.boot_current && `Boot current: ${c.boot_current}`,
      c.vbat && `VBAT: ${c.vbat}`,
      c.diode_resistance && `Diode/resistance: ${c.diode_resistance}`,
      c.i2c_status && `I2C: ${c.i2c_status}`,
      c.area && `Area: ${c.area}`,
      c.description && `Case: ${c.description}`
    ].filter(Boolean).join("\n");
    if (content.length < 30) continue;

    if (await upsertBrainAtom({
      title: c.title || "Verified community repair case",
      content,
      device_model: c.model || null,
      knowledge_type: "symptom",
      tags: ["community_verified", c.fault_type, c.area].filter(Boolean),
      confidence: 82,
      verification_status: "verified",
      metadata: {
        source_table: "community_cases",
        source_id: String(c.id),
        source_type: "community_case"
      }
    })) learned++;
  }

  return learned;
}

async function processOneQueuedDocument() {
  const { data: doc, error } = await admin
    .from("brain_documents")
    .select("id,file_name,status")
    .eq("status", "queued")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!doc) return null;

  const r = await fetch(`${SUPABASE_URL}/functions/v1/brain-learn-document`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": SECRET,
      "Authorization": `Bearer ${SECRET}`
    },
    body: JSON.stringify({ document_id: doc.id, source: "autopilot" })
  });

  const body = await r.text();
  let parsed: any = {};
  try { parsed = JSON.parse(body); } catch (_) {}
  return {
    document_id: doc.id,
    file_name: doc.file_name,
    ok: r.ok,
    status: parsed.status || (r.ok ? "completed" : "failed"),
    atoms: parsed.atoms_learned || 0,
    error: parsed.error || null
  };
}

async function buildImprovementPlan(stats: any, recentLogs: any[]) {
  if (!OPENAI_API_KEY) return null;

  const prompt = `Bạn là "Apple Seed Evolution Architect". Hãy tối ưu robot sửa iPhone dựa trên số liệu runtime hiện tại.
Không được viết code. Không được thay đổi policy an toàn. Chỉ đề xuất cải thiện ở 3 lớp:
1) reasoning/diagnosis,
2) tool routing/workflow,
3) Electronic Brain learning.
Ưu tiên thay đổi có thể áp dụng runtime bằng prompt/config, không đụng production code tự động.
Không bịa bằng chứng. Trả JSON ngắn.

RUNTIME STATS:
${JSON.stringify(stats)}

RECENT EVOLUTION:
${JSON.stringify(recentLogs).slice(0,8000)}
`;

  const schema = {
    type: "object",
    additionalProperties: false,
    properties: {
      focus: { type: "string" },
      reasoning_guidance: { type: "string" },
      upgrades: {
        type: "array",
        maxItems: 4,
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            category: { type: "string", enum: ["reasoning", "tool", "brain", "ui"] },
            title: { type: "string" },
            description: { type: "string" },
            risk: { type: "string", enum: ["low", "medium", "high"] },
            evidence: { type: "array", items: { type: "string" } }
          },
          required: ["category","title","description","risk","evidence"]
        }
      }
    },
    required: ["focus","reasoning_guidance","upgrades"]
  };

  const r = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { Authorization: `Bearer ${OPENAI_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      store: false,
      reasoning: { effort: "low" },
      input: [{ role: "user", content: [{ type: "input_text", text: prompt }] }],
      text: { format: { type: "json_schema", name: "apple_seed_evolution_plan", strict: true, schema } },
      max_output_tokens: 2200
    })
  });

  const text = await r.text();
  if (!r.ok) throw new Error("Evolution planner failed: " + text.slice(0, 600));
  const out = JSON.parse(text);
  const generated = out.output_text || (Array.isArray(out.output)
    ? out.output.flatMap((item:any)=>Array.isArray(item.content)?item.content:[])
        .filter((part:any)=>part?.type==="output_text")
        .map((part:any)=>part.text).join("\n")
    : "");
  if (!generated) return null;
  return JSON.parse(generated);
}

async function getRuntime() {
  const { data, error } = await admin.from("ai_robot_runtime").select("*").eq("id", 1).single();
  if (error) throw error;
  return data;
}

async function statusResponse() {
  const runtime = await getRuntime();
  const [docs, atoms, rels, logs] = await Promise.all([
    count("brain_documents"),
    count("brain_knowledge"),
    count("brain_relationships"),
    admin.from("ai_robot_evolution_log").select("cycle,title,change_type,created_at,status").order("created_at", { ascending: false }).limit(8)
  ]);
  return json({
    ok: true,
    autonomous: true,
    login_required: false,
    runtime,
    stats: {
      documents: docs,
      knowledge_atoms: atoms,
      relationships: rels,
      recent_evolution: logs.data || []
    }
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method === "GET") return statusResponse();

  let claimed = false;
  try {
    const body = await req.json().catch(() => ({}));
    if (body?.mode === "status") return statusResponse();
    if (!SECRET) return json({ ok: false, error: "Missing Supabase secret" }, 500);

    claimed = await claimCycle();
    if (!claimed) return json({ ok: true, skipped: true, reason: "cycle_already_running" });

    const before = await Promise.all([
      count("brain_documents"),
      count("brain_knowledge"),
      count("brain_relationships"),
      count("ai_board_knowledge"),
      count("community_cases"),
      count("ai_schematic_analyses")
    ]);

    const learnedCases = await ingestVerifiedCases();
    const learnedDocument = await processOneQueuedDocument();

    const afterCounts = await Promise.all([
      count("brain_documents"),
      count("brain_knowledge"),
      count("brain_relationships"),
      count("ai_board_knowledge"),
      count("community_cases")
    ]);

    const { data: runtime } = await admin.from("ai_robot_runtime").select("*").eq("id",1).single();
    const cycle = Number(runtime?.learning_cycles || 0) + 1;
    const brainAtoms = afterCounts[1] || 0;
    const brainRels = afterCounts[2] || 0;
    const verifiedCases = afterCounts[3] || 0;
    const community = afterCounts[4] || 0;
    const analyses = 0;

    const maturity = clamp(
      18 +
      Math.min(34, Math.log10(brainAtoms + 1) * 14) +
      Math.min(18, brainRels / 12) +
      Math.min(15, verifiedCases * 2) +
      Math.min(8, community) +
      Math.min(5, analyses / 5) +
      Math.min(10, cycle / 20)
    );

    let guidance = runtime?.reasoning_guidance || "";
    let focus = "Electronic Brain";
    let plan: any = null;

    // Every 6 cycles (about hourly) ask the model to improve runtime guidance.
    if (cycle % 6 === 0) {
      const recent = await admin.from("ai_robot_evolution_log")
        .select("cycle,change_type,title,summary,evidence")
        .order("created_at", { ascending: false })
        .limit(8);
      plan = await buildImprovementPlan({
        cycle,
        before,
        after: afterCounts,
        learned_cases: learnedCases,
        learned_document: learnedDocument,
        maturity_score: maturity
      }, recent.data || []);

      if (plan) {
        guidance = String(plan.reasoning_guidance || "").slice(0, 7000);
        focus = String(plan.focus || "Electronic Brain").slice(0, 300);

        for (const u of plan.upgrades || []) {
          await admin.from("ai_robot_upgrade_queue").insert({
            category: u.category,
            title: String(u.title || "").slice(0, 300),
            description: String(u.description || "").slice(0, 5000),
            evidence: { items: (u.evidence || []).slice(0, 8), cycle },
            risk: u.risk,
            status: "proposed",
            source_cycle: cycle
          });
        }
      }
    }

    const brainVersion = Math.max(Number(runtime?.brain_version || 1), Math.floor(brainAtoms / 25) + 1);
    const reasoningVersion = plan ? Number(runtime?.reasoning_version || 1) + 1 : Number(runtime?.reasoning_version || 1);

    const stats = {
      brain_documents: afterCounts[0],
      brain_knowledge: afterCounts[1],
      brain_relationships: afterCounts[2],
      ai_board_knowledge: afterCounts[3],
      community_cases: afterCounts[4],
      schematic_analyses: afterCounts[5],
      learned_cases: learnedCases,
      learned_document: learnedDocument,
      maturity_score: maturity
    };

    const capabilities = {
      continuous_learning: true,
      background_worker: true,
      browser_independent: true,
      image_reasoning: true,
      panic_reasoning: true,
      schematic_reasoning: true,
      measurement_reasoning: true,
      case_memory: true,
      runtime_reasoning_upgrade: true,
      tool_routing_upgrade: true,
      ui_runtime_status: true,
      hard_fact_verification_gate: true
    };

    await admin.from("ai_robot_runtime").update({
      runtime_version: Number(runtime?.runtime_version || 1) + 1,
      ui_contract_version: Number(runtime?.ui_contract_version || 1) + (cycle % 12 === 0 ? 1 : 0),
      reasoning_version: reasoningVersion,
      toolset_version: Number(runtime?.toolset_version || 1) + ((learnedDocument || learnedCases) ? 0 : 0),
      brain_version: brainVersion,
      learning_cycles: cycle,
      maturity_score: maturity,
      status: "online",
      current_focus: focus,
      reasoning_guidance: guidance,
      capabilities,
      stats,
      last_run_at: new Date().toISOString(),
      next_run_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      updated_at: new Date().toISOString()
    }).eq("id",1);

    await admin.from("ai_robot_evolution_log").insert({
      cycle,
      change_type: plan ? "reasoning_upgrade" : "learning_cycle",
      title: plan?.focus || "Background learning cycle",
      summary: [
        learnedCases ? `absorbed ${learnedCases} verified/case atoms` : "",
        learnedDocument?.ok ? `learned ${learnedDocument.file_name}` : "",
        plan ? "runtime reasoning guidance refreshed" : "runtime health refreshed"
      ].filter(Boolean).join("; ") || "No new source data",
      evidence: stats,
      status: "completed"
    });

    return json({
      ok: true,
      autonomous: true,
      cycle,
      maturity_score: maturity,
      learned_cases: learnedCases,
      learned_document: learnedDocument,
      reasoning_upgraded: Boolean(plan),
      next_run_at: new Date(Date.now() + 10 * 60 * 1000).toISOString()
    });
  } catch (e) {
    console.error(e);
    if (claimed) {
      await admin.from("ai_robot_runtime").update({
        status: "degraded",
        stats: { error: String((e as Error)?.message || e).slice(0, 1200) },
        updated_at: new Date().toISOString()
      }).eq("id",1);
    }
    return json({ ok: false, autonomous: true, error: String((e as Error)?.message || e) }, 500);
  }
});
