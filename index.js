// index.js - Rapido rule-based grader (simple)
const express = require('express');
const app = express();
app.use(express.json());

function containsAny(text, arr){
  if(!text) return false;
  const t = text.toLowerCase();
  return arr.some(a => t.includes(a.toLowerCase()));
}

function scoreReassurance(reply, customer_issue){
  let r = 0;
  if (containsAny(reply, ['sorry','apolog','understand','frustrat','annoyed','inconvenien'])) r++;
  if (customer_issue && customer_issue.split(' ').slice(0,6).some(word => reply.toLowerCase().includes(word.toLowerCase()))) r++;
  if (containsAny(reply, ['I can see','that must have','I understand how','totally understand'])) r++;
  return Math.min(r,3);
}

function scoreDelivery(reply, mandatory_actions){
  let d = 0;
  for (let act of mandatory_actions){
    const a = act.trim().toLowerCase();
    if (!a) continue;
    if (a.includes('refund') && containsAny(reply, ['refund','credited','credited to','wallet'])) d++;
    else if (a.includes('apolog') && containsAny(reply, ['sorry','apolog'])) d++;
    else if (a.includes('promo') && containsAny(reply, ['promo','coupon','voucher','coins'])) d++;
    else if (containsAny(reply, [a])) d++;
    if (d >= 3) break;
  }
  return Math.min(d,3);
}

function scoreElevate(reply){
  let e = 0;
  if (containsAny(reply, ['rebook','follow up','i will personally','i’ll personally','connect you to','escalat'])) e++;
  if (containsAny(reply, ['gesture','coins','promo','offer','voucher','credit'])) e++;
  return Math.min(e,2);
}

function scoreTone(reply){
  let t = 0;
  if (!containsAny(reply, ['as per policy','as per sop','please note that'])) t++;
  if (containsAny(reply, ["i'll","i'm","i’ve","we'll","we're","thanks","thank you","cheers"])) t++;
  return Math.min(t,2);
}

app.post('/grade', (req, res) => {
  const { case_id='', name='', customer_issue='', agent_reply='', mandatory_actions='' } = req.body;
  const reply = (agent_reply || '').toString();
  const mandatory = (mandatory_actions || '').split(',').map(s => s.trim()).filter(Boolean);

  const R = scoreReassurance(reply, customer_issue);
  const D = scoreDelivery(reply, mandatory);
  const E = scoreElevate(reply);
  const T = scoreTone(reply);
  const total = R + D + E + T;
  const pass = total >= 7;

  const suggested_edits = [
    `Hi ${name || 'Customer'}, I’m really sorry this happened. I understand how frustrating ${customer_issue || 'this'} must be. I have initiated a refund and credited it to your Rapido wallet. As a gesture, I've added a promo. Would you like me to rebook a ride now?`,
    `Hi ${name || 'there'}, apologies for the inconvenience. I’ve processed a refund and escalated this to City Ops for review. I’ve also added Rapido coins to your account. Tell me if you want us to rebook the ride.`
  ];

  res.json({
    case_id,
    score_total: total,
    score_breakdown: { Reassurance: R, Delivery: D, Elevate: E, Tone: T },
    pass,
    short_feedback: `${pass ? 'PASS' : 'FAIL'} — Total ${total}/10`,
    suggested_edits
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=> console.log('Grader running on port', PORT));
