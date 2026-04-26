import { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, Lightbulb, Beaker, TestTube, Leaf, Activity } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface HypothesisInputProps {
  onSubmit: (hypothesis: string) => void
}

const exampleHypotheses = [
  {
    title: 'Diagnostics',
    icon: Activity,
    hypothesis: 'A paper-based electrochemical biosensor functionalized with anti-CRP antibodies will detect C-reactive protein in whole blood at concentrations below 0.5 mg/L within 10 minutes, matching laboratory ELISA sensitivity without requiring sample preprocessing.',
    plain: 'Can we build a cheap, fast blood test for inflammation that works without lab equipment?',
  },
  {
    title: 'Gut Health',
    icon: Beaker,
    hypothesis: 'Supplementing C57BL/6 mice with Lactobacillus rhamnosus GG for 4 weeks will reduce intestinal permeability by at least 30% compared to controls, measured by FITC-dextran assay, due to upregulation of tight junction proteins claudin-1 and occludin.',
    plain: 'Does a specific probiotic measurably strengthen the gut lining in mice?',
  },
  {
    title: 'Cell Biology',
    icon: TestTube,
    hypothesis: 'Replacing sucrose with trehalose as a cryoprotectant in the freezing medium will increase post-thaw viability of HeLa cells by at least 15 percentage points compared to the standard DMSO protocol, due to trehalose\'s superior membrane stabilization at low temperatures.',
    plain: 'Can we keep more cells alive when freezing them by swapping one preservative for another?',
  },
  {
    title: 'Climate',
    icon: Leaf,
    hypothesis: 'Introducing Sporomusa ovata into a bioelectrochemical system at a cathode potential of −400mV vs SHE will fix CO₂ into acetate at a rate of at least 150 mmol/L/day, outperforming current biocatalytic carbon capture benchmarks by at least 20%.',
    plain: 'Can a specific microbe be used to convert CO₂ into a useful chemical compound more efficiently than current methods?',
  },
]

export function HypothesisInput({ onSubmit }: HypothesisInputProps) {
  const [hypothesis, setHypothesis] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = () => {
    if (hypothesis.trim().length < 20) {
      setError('Please enter a more detailed hypothesis (at least 20 characters)')
      return
    }
    setError('')
    onSubmit(hypothesis.trim())
  }

  const handleExampleClick = (text: string) => {
    setHypothesis(text)
    setError('')
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-8"
    >
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold text-foreground text-balance">
          What experiment do you want to run?
        </h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-pretty">
          Enter your scientific hypothesis in natural language. We&apos;ll check the literature,
          then generate a complete, operationally realistic experiment plan.
        </p>
      </div>

      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-primary" />
            Your Hypothesis
          </CardTitle>
          <CardDescription>
            Be specific: name the intervention, state a measurable outcome with a threshold,
            and give a mechanistic reason.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="e.g., Replacing sucrose with trehalose as a cryoprotectant will increase post-thaw viability of HeLa cells by at least 15 percentage points..."
            value={hypothesis}
            onChange={(e) => {
              setHypothesis(e.target.value)
              if (error) setError('')
            }}
            className="min-h-32 resize-none"
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button onClick={handleSubmit} className="w-full" size="lg">
            Analyze Hypothesis
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h3 className="text-center text-sm font-medium text-muted-foreground">
          Or try an example hypothesis
        </h3>
        <div className="grid gap-4 md:grid-cols-2">
          {exampleHypotheses.map((example) => {
            const Icon = example.icon
            return (
              <motion.div
                key={example.title}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Card
                  className="cursor-pointer hover:border-primary/50 transition-colors h-full"
                  onClick={() => handleExampleClick(example.hypothesis)}
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Icon className="h-4 w-4 text-primary" />
                      {example.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground italic">
                      &quot;{example.plain}&quot;
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>
      </div>
    </motion.div>
  )
}
