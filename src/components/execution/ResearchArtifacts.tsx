import type { ResearchArtifact } from '../../models/research';

interface ResearchArtifactsProps {
  artifacts: ResearchArtifact[];
}

export function ResearchArtifacts({ artifacts }: ResearchArtifactsProps) {
  if (artifacts.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold">Research ({artifacts.length} artifacts)</h3>
      {artifacts.map(artifact => (
        <div key={artifact.id} className="card bg-base-200">
          <div className="card-body p-3 gap-1">
            <div className="flex items-center gap-2">
              <span className="badge badge-xs badge-ghost">{artifact.type}</span>
              <span className="badge badge-xs badge-ghost">Step {artifact.stepNumber}</span>
            </div>
            <h4 className="text-sm font-medium">{artifact.title}</h4>
            <pre className="whitespace-pre-wrap text-xs text-base-content/70">
              {artifact.content.slice(0, 500)}
              {artifact.content.length > 500 && '...'}
            </pre>
            {artifact.sources.length > 0 && (
              <div className="text-xs text-base-content/50 mt-1">
                {artifact.sources.length} source(s)
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
