"use client";

import { 
  Brain, 
  Languages, 
  Users2, 
  ShieldCheck, 
  TrendingUp, 
  ListChecks,
  Ear,
  MessageSquareQuote,
  Sparkles
} from "lucide-react";

interface SecondBrainFeature {
  icon: React.ElementType;
  title: string;
  description: string;
  example?: string;
}

const secondBrainFeatures: SecondBrainFeature[] = [
  {
    icon: Sparkles,
    title: "Wake Word Activation",
    description: "Just say 'Hey Echo' anytime—no buttons needed. Echo is always ready to help.",
    example: '"Hey Echo, add a task to buy groceries"',
  },
  {
    icon: Languages,
    title: "Real-Time Translation",
    description: "Echo detects and translates foreign languages instantly, whispering translations in your ear.",
    example: 'Someone speaks Chinese → Echo whispers: "They said: Where is the park?"',
  },
  {
    icon: Users2,
    title: "Multi-Speaker Recognition",
    description: "Echo knows who said what. Track conversations by person and recall them later.",
    example: '"Echo, what did Adam say about the party?" → Shows full conversation',
  },
  {
    icon: ShieldCheck,
    title: "Privacy Mode",
    description: "Say 'Give me privacy' and Echo stops listening. Your private conversations stay private.",
    example: '"Echo, give me privacy" → Mic turns off until you say "Hey Echo"',
  },
  {
    icon: TrendingUp,
    title: "Real-Time Fact Checking",
    description: "During negotiations, Echo whispers market prices and suggestions in your ear.",
    example: 'Partner: "$300" → Echo whispers: "Market average is $200. Consider negotiating."',
  },
  {
    icon: ListChecks,
    title: "Automatic List Capture",
    description: "When someone gives you a list, Echo captures it automatically and asks to save.",
    example: 'Friend: "Bring chips, drinks, plates" → Echo: "Saved 3 items from conversation"',
  },
  {
    icon: Ear,
    title: "In-Ear Whisper Mode",
    description: "Echo speaks quietly so only you can hear—perfect for real-time assistance during conversations.",
    example: "Whispers translations, suggestions, and reminders without interrupting",
  },
  {
    icon: MessageSquareQuote,
    title: "Conversation Recall",
    description: "Search and recall any past conversation by person, topic, or keyword.",
    example: '"Echo, what items did John mention?" → Shows complete list',
  },
];

function SecondBrainFeatureCard({ feature }: { feature: SecondBrainFeature }) {
  return (
    <div className="p-6 rounded-2xl bg-gradient-to-br from-purple-900/30 to-fuchsia-900/20 border border-purple-500/20 hover:border-purple-400/40 transition-all group">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-fuchsia-500 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
          <feature.icon className="h-6 w-6 text-white" />
        </div>
        <div className="flex-1">
          <h4 className="text-lg font-semibold text-white mb-2">{feature.title}</h4>
          <p className="text-slate-400 text-sm mb-3">{feature.description}</p>
          {feature.example && (
            <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-700/50">
              <p className="text-xs text-purple-300 font-mono">{feature.example}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SecondBrainSection() {
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-slate-900/50 to-purple-950/30">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-sm mb-6">
            <Brain className="h-4 w-4" />
            <span>Your Second Brain</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Always-On AI That{" "}
            <span className="bg-gradient-to-r from-purple-400 to-fuchsia-400 bg-clip-text text-transparent">
              Remembers Everything
            </span>
          </h2>
          <p className="text-xl text-slate-400 max-w-3xl mx-auto">
            Echo is more than an assistant—it's your second brain. Always listening, 
            translating, fact-checking, and remembering so you don't have to.
          </p>
        </div>

        {/* Day in the Life Scenario */}
        <div className="mb-16 p-8 rounded-3xl bg-gradient-to-br from-slate-900 to-purple-950/50 border border-purple-500/20">
          <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-400" />
            A Day with Echo as Your Second Brain
          </h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <ScenarioCard
                time="9:00 AM"
                title="Walking to Work"
                description='A tourist asks for directions in Chinese. Echo whispers: "They asked: Where is the park?" You respond, and Echo translates back.'
              />
              <ScenarioCard
                time="11:30 AM"
                title="Meeting with Adam"
                description='Adam lists party supplies. Echo whispers: "Heard 5 items. Save?" You say yes. Later, ask "What did Adam say?" and get the full list.'
              />
            </div>
            <div className="space-y-4">
              <ScenarioCard
                time="2:00 PM"
                title="Private Conversation"
                description='You say "Echo, give me privacy." Echo confirms and stops listening. When done, say "Hey Echo" to resume.'
              />
              <ScenarioCard
                time="4:30 PM"
                title="Business Negotiation"
                description='Partner offers $300. Echo whispers: "Market average is $200." You negotiate to $220. Echo whispers: "Good job, saved $80."'
              />
            </div>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {secondBrainFeatures.map((feature, index) => (
            <SecondBrainFeatureCard key={index} feature={feature} />
          ))}
        </div>
      </div>
    </section>
  );
}

function ScenarioCard({ 
  time, 
  title, 
  description 
}: { 
  time: string; 
  title: string; 
  description: string;
}) {
  return (
    <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
      <div className="flex items-center gap-3 mb-2">
        <span className="text-xs font-mono text-purple-400 bg-purple-500/10 px-2 py-1 rounded">
          {time}
        </span>
        <h4 className="font-medium text-white">{title}</h4>
      </div>
      <p className="text-sm text-slate-400">{description}</p>
    </div>
  );
}