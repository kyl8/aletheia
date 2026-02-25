import React, { useState, type ReactNode } from "react";
import { Trash2, Type, Briefcase, GraduationCap, LayoutGrid, Code, ChevronDown } from "lucide-react";
import type { ResumeData, SkillCategory } from "../../utils/cv/parser";
import { t, type Lang } from "../../utils/i18n";

interface ResumeFormProps { data: ResumeData; setData: React.Dispatch<React.SetStateAction<ResumeData>>; lang: Lang; }
interface ModuleProps { title: string; icon: React.ElementType; tag: string; children: ReactNode; onAdd?: () => void; addLabel: string; accentColor: string; }

const INPUT = "w-full bg-white dark:bg-zinc-950 border-4 border-zinc-900 dark:border-zinc-200 rounded-none px-4 py-3 font-vt323 text-2xl focus:outline-none focus:bg-indigo-50 dark:focus:bg-indigo-900/30 transition-colors placeholder:text-zinc-400 dark:placeholder:text-zinc-600";
const SELECT = "w-full bg-white dark:bg-zinc-950 border-4 border-zinc-900 dark:border-zinc-200 rounded-none px-4 py-3 font-vt323 text-2xl focus:outline-none appearance-none cursor-pointer";
const TEXTAREA = "w-full bg-white dark:bg-zinc-950 border-4 border-zinc-900 dark:border-zinc-200 rounded-none p-5 font-vt323 text-2xl focus:outline-none focus:bg-indigo-50 dark:focus:bg-indigo-900/30 min-h-[160px] resize-y transition-colors placeholder:text-zinc-400 dark:placeholder:text-zinc-600";
const LABEL = "font-dotgothic text-sm font-bold uppercase tracking-widest text-zinc-900 dark:text-zinc-100 mb-2 block";

function Module({ title, icon: Icon, tag, children, onAdd, addLabel, accentColor }: ModuleProps) {
  return (
    <section className="bg-zinc-100 dark:bg-zinc-900 p-8 md:p-10 pixel-box relative">
      <div className={`absolute top-0 left-0 w-full h-2 ${accentColor}`} />
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 border-b-4 border-zinc-900 dark:border-zinc-200 pb-6 gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white dark:bg-zinc-950 border-4 border-zinc-900 dark:border-zinc-200 flex items-center justify-center text-zinc-900 dark:text-zinc-100">
            <Icon size={24} strokeWidth={3} />
          </div>
          <div>
            <h3 className="font-silkscreen text-xl text-zinc-900 dark:text-white uppercase">{title}</h3>
            <span className="font-dotgothic text-indigo-600 dark:text-emerald-400 text-sm block mt-1">//{tag}</span>
          </div>
        </div>
        {onAdd && (
          <button onClick={onAdd} className="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-silkscreen text-xs uppercase px-5 py-3 pixel-box">
            + {addLabel}
          </button>
        )}
      </div>
      <div className="w-full">{children}</div>
    </section>
  );
}

export default function ResumeForm({ data, setData, lang }: ResumeFormProps) {
  const [newTitle, setNewTitle] = useState("");
  const handleChange = <K extends keyof ResumeData>(field: K, value: ResumeData[K]) => setData(prev => ({ ...prev, [field]: value }));

  const addExperience = () => setData(prev => ({ ...prev, experiencias: [...prev.experiencias, { cargo: "", empresa: "", periodo: "", descricao: "", local: "", tipo: "" }] }));
  const updateExperience = (index: number, key: string, value: string) => setData(prev => { const list = [...prev.experiencias]; list[index] = { ...list[index], [key]: value }; return { ...prev, experiencias: list }; });
  
  const updateEducation = (index: number, key: string, value: string) => setData(prev => { const list = [...prev.formacao]; list[index] = { ...list[index], [key]: value }; return { ...prev, formacao: list }; });
  
  const addSkillCategory = () => setData(prev => ({ ...prev, habilidades: [...(prev.habilidades || []), { id: crypto.randomUUID(), categoria: "", itens: "" }] }));
  const updateSkill = (index: number, field: keyof SkillCategory, value: string) => setData(prev => { const list = [...prev.habilidades]; list[index] = { ...list[index], [field]: value }; return { ...prev, habilidades: list }; });

  const addCustomSection = () => { if (newTitle.trim()) { handleChange("customSections", [...(data.customSections || []), { id: crypto.randomUUID(), title: newTitle.trim(), content: "" }]); setNewTitle(""); } };

  return (
    <div className="space-y-12">
      {/* IDENTIDADE */}
      <Module title={t("identityTitle", lang)} icon={Type} tag="PROFILE_DATA" accentColor="bg-indigo-500" addLabel={t("add", lang)}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {[ { id: "nome", label: t("fullName", lang) }, { id: "email", label: t("email", lang) }, { id: "telefone", label: t("phone", lang) }, { id: "localizacao", label: t("location", lang) }, { id: "links", label: t("professionalLinks", lang) }].map((f) => (
            <div key={f.id} className="flex flex-col">
              <label className={LABEL}>{f.label}</label>
              <input value={(data as any)[f.id] || ""} onChange={(e) => handleChange(f.id as any, e.target.value)} className={INPUT} />
            </div>
          ))}
        </div>
        <div className="flex flex-col mt-8">
          <label className={LABEL}>{t("summaryLabel", lang)}</label>
          <textarea value={data.resumo || ""} onChange={(e) => handleChange("resumo", e.target.value)} className={TEXTAREA} placeholder={t("summaryPlaceholder", lang)} />
        </div>
      </Module>

      {/* EXPERIÊNCIA */}
      <Module title={t("experienceTitle", lang)} icon={Briefcase} tag="JOB_HISTORY" accentColor="bg-emerald-500" addLabel={t("add", lang)} onAdd={addExperience}>
        <div className="space-y-12">
          {data.experiencias.map((exp: any, i: number) => (
            <div key={i} className="bg-zinc-200/50 dark:bg-zinc-800/50 p-6 md:p-8 border-4 border-zinc-900 dark:border-zinc-200 relative">
              <button onClick={() => setData(p => ({...p, experiencias: p.experiencias.filter((_, idx) => idx !== i)}))} className="absolute -top-4 -right-4 bg-red-500 text-white p-2 border-4 border-zinc-900 pixel-box hover:bg-red-600">
                <Trash2 size={20} strokeWidth={3} />
              </button>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <div>
                  <label className={LABEL}>Empresa</label>
                  <input placeholder="Ex: Nintendo" className={INPUT} value={exp.empresa} onChange={e => updateExperience(i, "empresa", e.target.value)} />
                </div>
                <div>
                  <label className={LABEL}>Regime</label>
                  <div className="relative">
                    <select className={SELECT} value={exp.tipo || ""} onChange={e => updateExperience(i, "tipo", e.target.value)}>
                      <option value="">Selecionar...</option>
                      <option value="Remoto">Remoto</option>
                      <option value="Híbrido">Híbrido</option>
                      <option value="Presencial">Presencial</option>
                    </select>
                    <ChevronDown size={20} strokeWidth={3} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-900 dark:text-zinc-100 pointer-events-none" />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <div><label className={LABEL}>Cargo</label><input className={INPUT} value={exp.cargo} onChange={e => updateExperience(i, "cargo", e.target.value)} /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className={LABEL}>Período</label><input className={INPUT} value={exp.periodo} onChange={e => updateExperience(i, "periodo", e.target.value)} /></div>
                  <div><label className={LABEL}>Local</label><input className={INPUT} value={exp.local || ""} onChange={e => updateExperience(i, "local", e.target.value)} /></div>
                </div>
              </div>
              <textarea placeholder={t("descPlaceholder", lang)} className={TEXTAREA} value={exp.descricao} onChange={e => updateExperience(i, "descricao", e.target.value)} />
            </div>
          ))}
        </div>
      </Module>

      {/* HABILIDADES */}
      <Module title={t("skillsTitle", lang) || "Habilidades"} icon={Code} tag="SKILLS_SET" accentColor="bg-blue-500" addLabel={t("add", lang)} onAdd={addSkillCategory}>
        <div className="space-y-8">
          {(data.habilidades || []).map((skill, i) => (
            <div key={skill.id || i} className="flex flex-col md:flex-row items-start gap-6 bg-zinc-200/50 dark:bg-zinc-800/50 p-6 md:p-8 border-4 border-zinc-900 dark:border-zinc-200 relative">
              <button onClick={() => setData(p => ({...p, habilidades: p.habilidades.filter((_, idx) => idx !== i)}))} className="absolute -top-4 -right-4 bg-red-500 text-white p-2 border-4 border-zinc-900 pixel-box hover:bg-red-600">
                <Trash2 size={20} strokeWidth={3} />
              </button>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
                <div className="md:col-span-1">
                  <label className={LABEL}>Categoria</label>
                  <input placeholder="Ex: Linguagens" className={INPUT} value={skill.categoria || ""} onChange={(e) => updateSkill(i, "categoria", e.target.value)} />
                </div>
                <div className="md:col-span-2">
                  <label className={LABEL}>Tecnologias / Itens</label>
                  <input placeholder="Ex: Python, Rust, TypeScript" className={INPUT} value={skill.itens || ""} onChange={(e) => updateSkill(i, "itens", e.target.value)} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </Module>

      {/* FORMAÇÃO COM NOVO STATUS */}
      <Module title={t("educationTitle", lang)} icon={GraduationCap} tag="EDUCATION" accentColor="bg-amber-500" addLabel={t("add", lang)} onAdd={() => handleChange("formacao", [...data.formacao, { curso: "", instituicao: "", periodo: "", descricao: "", status: "" }])}>
        <div className="space-y-8">
          {data.formacao.map((edu: any, i: number) => (
            <div key={i} className="flex flex-col gap-6 bg-zinc-200/50 dark:bg-zinc-800/50 p-6 md:p-8 border-4 border-zinc-900 dark:border-zinc-200 relative">
              <button onClick={() => setData(p => ({...p, formacao: p.formacao.filter((_, idx) => idx !== i)}))} className="absolute -top-4 -right-4 bg-red-500 text-white p-2 border-4 border-zinc-900 pixel-box hover:bg-red-600">
                <Trash2 size={20} strokeWidth={3} />
              </button>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                <div><label className={LABEL}>Instituição</label><input className={INPUT} value={edu.instituicao} onChange={(e) => updateEducation(i, "instituicao", e.target.value)} /></div>
                <div><label className={LABEL}>Curso</label><input className={INPUT} value={edu.curso} onChange={(e) => updateEducation(i, "curso", e.target.value)} /></div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                <div><label className={LABEL}>Período</label><input className={INPUT} value={edu.periodo} onChange={(e) => updateEducation(i, "periodo", e.target.value)} /></div>
                <div>
                  <label className={LABEL}>Status</label>
                  <div className="relative">
                    <select className={SELECT} value={edu.status || ""} onChange={e => updateEducation(i, "status", e.target.value)}>
                      <option value="">Nenhum</option>
                      <option value="CURSANDO">Cursando</option>
                      <option value="CONCLUÍDO">Concluído</option>
                      <option value="TRANCADO">Trancado</option>
                      <option value="INCOMPLETO">Incompleto</option>
                    </select>
                    <ChevronDown size={20} strokeWidth={3} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-900 dark:text-zinc-100 pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Module>

        
      {/* ADICIONAR NOVA SEÇÃO */}
      {/* TENHO  Q DEIXAR ISSO FUNCIONAL, POR ENQUANTO É SO ENFEITE*/}
      <div className=" hidden disabled p-8 border-4 border-dashed border-zinc-900 dark:border-zinc-200 flex flex-col sm:flex-row items-center gap-6 bg-zinc-100 dark:bg-zinc-900">
        <div className="flex-grow w-full">
          <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addCustomSection()} placeholder={t("newSection", lang)} className="bg-transparent border-b-4 border-zinc-900 dark:border-zinc-200 outline-none font-vt323 text-2xl w-full text-zinc-900 dark:text-zinc-100 py-2" />
        </div>
        <button onClick={addCustomSection} className="bg-indigo-600 text-white font-silkscreen text-xs uppercase px-8 py-4 pixel-box whitespace-nowrap">
          {t("attachModule", lang)}
        </button>
      </div>
    </div>
  );
}