import { ProductionRiskAssessment } from '@/lib/types';
import { AlertTriangle, TrendingUp, Cloud, Users, Calendar, Sparkles } from 'lucide-react';

interface ProductionRiskPanelProps {
  risk: ProductionRiskAssessment;
}

export default function ProductionRiskPanel({ risk }: ProductionRiskPanelProps) {
  const getRiskColor = (score: number) => {
    if (score >= 7) return 'text-red-400';
    if (score >= 4) return 'text-yellow-400';
    return 'text-green-400';
  };

  const getRiskBg = (score: number) => {
    if (score >= 7) return 'bg-red-500/10 border-red-500/30';
    if (score >= 4) return 'bg-yellow-500/10 border-yellow-500/30';
    return 'bg-green-500/10 border-green-500/30';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <h2 className="text-2xl font-display font-bold text-gradient-gold">Production Risk Advisor</h2>

      {/* Overall Score */}
      <div className={`glass-card p-6 text-center border ${getRiskBg(risk.overall_risk_score)}`}>
        <div className="flex justify-center mb-3">
          <AlertTriangle className={`h-12 w-12 ${getRiskColor(risk.overall_risk_score)}`} />
        </div>
        <p className={`text-5xl font-display font-bold ${getRiskColor(risk.overall_risk_score)}`}>
          {risk.overall_risk_score.toFixed(1)}
        </p>
        <p className="text-sm text-muted-foreground mt-2">Overall Production Risk Score</p>
      </div>

      {/* Risk Factors */}
      <div className="glass-card p-5">
        <h3 className="text-lg font-semibold text-primary mb-4 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Key Risk Factors
        </h3>
        <div className="space-y-3">
          {risk.risk_factors.map((factor, i) => (
            <div key={i} className="flex items-start gap-3 p-3 bg-secondary/50 rounded-lg border border-border/50">
              <span className="text-2xl">⚠️</span>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">{factor.factor}</p>
                <p className="text-xs text-muted-foreground mt-1">{factor.description}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`text-xs font-semibold ${getRiskColor(factor.severity)}`}>
                    Severity: {factor.severity.toFixed(1)}
                  </span>
                  {factor.mitigation && (
                    <span className="text-xs text-green-400">• Mitigable</span>
                  )}
                </div>
                {factor.mitigation && (
                  <p className="text-xs text-green-400/80 mt-1 italic">
                    💡 {factor.mitigation}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Hidden Cost Drivers */}
      <div className="glass-card p-5">
        <h3 className="text-lg font-semibold text-primary mb-4 flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Hidden Cost Drivers
        </h3>
        <div className="space-y-2">
          {risk.hidden_cost_drivers.map((driver, i) => (
            <div key={i} className="flex items-start gap-3 p-3 bg-orange-500/10 rounded-lg border border-orange-500/20">
              <span className="text-xl">💸</span>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">{driver.category}</p>
                <p className="text-xs text-muted-foreground mt-1">{driver.explanation}</p>
                <p className="text-xs text-orange-400 mt-1 font-semibold">
                  Est. Impact: {driver.estimated_budget_increase_percentage}%
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Risk Dimension Scores */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="glass-card p-4 text-center">
          <Calendar className="h-6 w-6 mx-auto mb-2 text-blue-400" />
          <p className={`text-2xl font-bold ${getRiskColor(risk.schedule_complexity_score)}`}>
            {risk.schedule_complexity_score.toFixed(1)}
          </p>
          <p className="text-[10px] text-muted-foreground mt-1">Schedule Complexity</p>
        </div>

        <div className="glass-card p-4 text-center">
          <Sparkles className="h-6 w-6 mx-auto mb-2 text-purple-400" />
          <p className={`text-2xl font-bold ${getRiskColor(risk.vfx_dependency_score)}`}>
            {risk.vfx_dependency_score.toFixed(1)}
          </p>
          <p className="text-[10px] text-muted-foreground mt-1">VFX Dependency</p>
        </div>

        <div className="glass-card p-4 text-center">
          <Users className="h-6 w-6 mx-auto mb-2 text-amber-400" />
          <p className={`text-2xl font-bold ${getRiskColor(risk.crowd_management_risk)}`}>
            {risk.crowd_management_risk.toFixed(1)}
          </p>
          <p className="text-[10px] text-muted-foreground mt-1">Crowd Management</p>
        </div>

        <div className="glass-card p-4 text-center">
          <Cloud className="h-6 w-6 mx-auto mb-2 text-cyan-400" />
          <p className={`text-2xl font-bold ${getRiskColor(risk.weather_dependency_risk)}`}>
            {risk.weather_dependency_risk.toFixed(1)}
          </p>
          <p className="text-[10px] text-muted-foreground mt-1">Weather Dependency</p>
        </div>

        <div className="glass-card p-4 text-center">
          <TrendingUp className="h-6 w-6 mx-auto mb-2 text-pink-400" />
          <p className={`text-2xl font-bold ${getRiskColor(risk.star_scheduling_risk)}`}>
            {risk.star_scheduling_risk.toFixed(1)}
          </p>
          <p className="text-[10px] text-muted-foreground mt-1">Star Scheduling</p>
        </div>
      </div>
    </div>
  );
}
