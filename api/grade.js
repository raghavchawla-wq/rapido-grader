export default function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(404).send("Not Found");
  }

  const data = req.body || {};

  const reply = (data.agent_reply || "").toLowerCase();
  const issue = (data.customer_issue || "").toLowerCase();
  const actions = (data.mandatory_actions || "").split(",").map(a => a.trim());

  // SIMPLE SCORING
  let R = reply.includes("sorry") || reply.includes("understand") ? 2 : 0;
  let D = actions.filter(a => reply.includes(a)).length;
  if (D > 3) D = 3;

  let E = reply.includes("rebook") ? 1 : 0;
  let T = reply.includes("thank") ? 1 : 0;

  const total = R + D + E + T;

  res.status(200).json({
    score_total: total,
    pass: total >= 5,
    short_feedback: `Score: ${total}/10`,
    score_breakdown: {
      Reassurance: R,
      Delivery: D,
      Elevate: E,
      Tone: T
    }
  });
}
