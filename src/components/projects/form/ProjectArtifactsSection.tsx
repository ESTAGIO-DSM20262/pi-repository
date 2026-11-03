'use client'

import { Badge, FormSection } from '@/components/projects/form/ProjectFormPrimitives'
import {
  type DraftProjectImage,
  ProjectImagesEditor,
} from '@/components/projects/form/ProjectImagesEditor'
import {
  type DraftProjectLink,
  ProjectLinksEditor,
} from '@/components/projects/form/ProjectLinksEditor'
import type { ProjectLinkInput } from '@/domain/enterprise/entities/project-details'

interface ProjectArtifactsSectionProps {
  links: DraftProjectLink[]
  onAddLink: (preset?: { title: string; icon: string }) => void
  onUpdateLink: (key: string, changes: Partial<ProjectLinkInput>) => void
  onRemoveLink: (key: string) => void
  images: DraftProjectImage[]
  onImagesChange: (images: DraftProjectImage[]) => void
}

export function ProjectArtifactsSection({
  links,
  onAddLink,
  onUpdateLink,
  onRemoveLink,
  images,
  onImagesChange,
}: ProjectArtifactsSectionProps) {
  return (
    <FormSection
      icon="fi-rr-folder-open"
      title="Artefatos do Projeto"
      subtitle="Links e imagens que apresentam o resultado do PI"
      badge={<Badge tone="green">Opcional</Badge>}
    >
      <div className="space-y-7">
        <ProjectLinksEditor
          links={links}
          onAdd={onAddLink}
          onUpdate={onUpdateLink}
          onRemove={onRemoveLink}
        />
        <ProjectImagesEditor images={images} onChange={onImagesChange} />
      </div>
    </FormSection>
  )
}
