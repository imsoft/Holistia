"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";

const filters = [
  {
    id: "category",
    name: "Categoría",
    options: [
      { value: "all", label: "Todas las categorías" },
      { value: "professionals", label: "Profesionales" },
      { value: "centers", label: "Centros" },
      { value: "events", label: "Eventos y talleres" },
      { value: "challenges", label: "Retos" },
      { value: "restaurants", label: "Restaurantes" },
      { value: "food-market", label: "Food market" },
    ],
  },
  {
    id: "service-type",
    name: "Modalidad",
    options: [
      { value: "any", label: "Cualquier modalidad" },
      { value: "presencial", label: "Presencial" },
      { value: "online", label: "En línea" },
      { value: "ambos", label: "Presencial y en línea" },
    ],
  },
  {
    id: "price",
    name: "Precio por sesión",
    options: [
      { value: "any", label: "Cualquier precio" },
      { value: "budget", label: "Económico (<$1,500)" },
      { value: "mid-range", label: "Rango medio ($1,500-$2,000)" },
      { value: "premium", label: "Premium (>$2,000)" },
    ],
  },
  {
    id: "location",
    name: "Ubicación",
    options: [
      { value: "any", label: "Cualquier ubicación" },
      { value: "cdmx", label: "Ciudad de México" },
      { value: "guadalajara", label: "Guadalajara" },
      { value: "monterrey", label: "Monterrey" },
      { value: "puebla", label: "Puebla" },
      { value: "tijuana", label: "Tijuana" },
      { value: "cancun", label: "Cancún" },
    ],
  },
  {
    id: "availability",
    name: "Disponibilidad",
    options: [
      { value: "any", label: "Cualquier momento" },
      { value: "today", label: "Disponible hoy" },
      { value: "tomorrow", label: "Disponible mañana" },
      { value: "week", label: "Esta semana" },
      { value: "booking", label: "Con opción de reserva" },
    ],
  },
];

interface FiltersProps {
  onFilterChange?: (filters: Record<string, string[]>) => void;
  eventFilters?: {
    category: string;
    price: string;
    date: string;
  };
  onEventFilterChange?: (filterType: string, value: string) => void;
}

export const Filters = ({ onFilterChange, eventFilters, onEventFilterChange }: FiltersProps) => {
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string[]>>({});

  const handleFilterChange = (sectionId: string, optionValue: string, checked: boolean) => {
    const newFilters = { ...selectedFilters };
    
    if (!newFilters[sectionId]) {
      newFilters[sectionId] = [];
    }

    if (checked) {
      newFilters[sectionId].push(optionValue);
    } else {
      newFilters[sectionId] = newFilters[sectionId].filter(value => value !== optionValue);
    }

    setSelectedFilters(newFilters);
    onFilterChange?.(newFilters);
  };

  const clearAllFilters = () => {
    const emptyFilters: Record<string, string[]> = {};
    setSelectedFilters(emptyFilters);
    onFilterChange?.(emptyFilters);
  };

  const hasActiveFilters = Object.values(selectedFilters).some(filters => filters.length > 0);

  const FilterSection = ({ section }: { section: typeof filters[0] }) => (
    <div className="py-8 first:pt-0 last:pb-0">
      <fieldset>
        <legend className="block text-sm font-medium text-foreground mb-6">
          {section.name}
        </legend>
        <div className="space-y-4">
          {section.options.map((option, optionIdx) => (
            <div key={option.value} className="flex gap-3">
              <div className="flex h-5 shrink-0 items-center">
                <div className="group grid size-4 grid-cols-1">
                  <input
                    checked={selectedFilters[section.id]?.includes(option.value) || false}
                    onChange={(e) => handleFilterChange(section.id, option.value, e.target.checked)}
                    id={`${section.id}-${optionIdx}`}
                    name={`${section.id}[]`}
                    type="checkbox"
                    className="col-start-1 row-start-1 appearance-none rounded-sm border border-border bg-background checked:border-primary checked:bg-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:border-border disabled:bg-muted disabled:checked:bg-muted"
                  />
                  <svg
                    fill="none"
                    viewBox="0 0 14 14"
                    className="pointer-events-none col-start-1 row-start-1 size-3.5 self-center justify-self-center stroke-primary-foreground group-has-disabled:stroke-muted-foreground"
                  >
                    <path
                      d="M3 8L6 11L11 3.5"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="opacity-0 group-has-checked:opacity-100"
                    />
                  </svg>
                </div>
              </div>
              <label htmlFor={`${section.id}-${optionIdx}`} className="text-sm text-muted-foreground cursor-pointer">
                {option.label}
              </label>
            </div>
          ))}
        </div>
      </fieldset>
    </div>
  );

  return (
    <>
      {/* Mobile filter button */}
      <Button
        variant="outline"
        onClick={() => setMobileFiltersOpen(true)}
        className="lg:hidden mb-6"
      >
        <Plus className="h-4 w-4 mr-2" />
        Filtros
      </Button>

      {/* Mobile filters sheet */}
      <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
        <SheetContent side="right" className="w-full sm:max-w-sm p-6">
          <SheetTitle className="sr-only">Filtros de búsqueda</SheetTitle>
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-lg font-medium text-foreground">Filtros</h2>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3 mr-1" />
                Limpiar
              </Button>
            )}
          </div>
          <form className="divide-y divide-border">
            {filters.map((section) => (
              <FilterSection key={section.id} section={section} />
            ))}
            
            {/* Filtros de Eventos - Mobile */}
            {eventFilters && onEventFilterChange && (
              <div className="py-6">
                <h3 className="text-sm font-medium text-foreground mb-4">Filtros de Eventos</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-3 block">
                      Categoría
                    </label>
                    <div className="space-y-2">
                      {[
                        { value: "all", label: "Todas las categorías" },
                        { value: "espiritualidad", label: "Espiritualidad" },
                        { value: "salud_mental", label: "Salud Mental" },
                        { value: "salud_fisica", label: "Salud Física" },
                        { value: "alimentacion", label: "Alimentación" },
                        { value: "social", label: "Social" }
                      ].map((option) => (
                        <label key={option.value} className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={eventFilters.category === option.value}
                            onChange={() => onEventFilterChange('category', option.value)}
                            className="rounded border-border"
                          />
                          <span className="text-sm text-foreground">{option.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-3 block">
                      Precio
                    </label>
                    <div className="space-y-2">
                      {[
                        { value: "all", label: "Todos los precios" },
                        { value: "free", label: "Gratuitos" },
                        { value: "paid", label: "Con costo" }
                      ].map((option) => (
                        <label key={option.value} className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={eventFilters.price === option.value}
                            onChange={() => onEventFilterChange('price', option.value)}
                            className="rounded border-border"
                          />
                          <span className="text-sm text-foreground">{option.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-3 block">
                      Fecha
                    </label>
                    <div className="space-y-2">
                      {[
                        { value: "all", label: "Todas las fechas" },
                        { value: "today", label: "Hoy" },
                        { value: "tomorrow", label: "Mañana" },
                        { value: "week", label: "Esta semana" },
                        { value: "month", label: "Este mes" }
                      ].map((option) => (
                        <label key={option.value} className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={eventFilters.date === option.value}
                            onChange={() => onEventFilterChange('date', option.value)}
                            className="rounded border-border"
                          />
                          <span className="text-sm text-foreground">{option.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </form>
        </SheetContent>
      </Sheet>

      {/* Desktop filters */}
      <div className="hidden lg:block">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-medium text-foreground">Filtros</h2>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              <X className="h-3 w-3 mr-1" />
              Limpiar
            </Button>
          )}
        </div>
        <form className="divide-y divide-border">
          {filters.map((section) => (
            <FilterSection key={section.id} section={section} />
          ))}
          
          {/* Filtros de Eventos - Desktop */}
          {eventFilters && onEventFilterChange && (
            <div className="py-6">
              <h3 className="text-sm font-medium text-foreground mb-4">Filtros de Eventos</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-3 block">
                    Categoría
                  </label>
                  <div className="space-y-2">
                    {[
                      { value: "all", label: "Todas las categorías" },
                      { value: "espiritualidad", label: "Espiritualidad" },
                      { value: "salud_mental", label: "Salud Mental" },
                      { value: "salud_fisica", label: "Salud Física" },
                      { value: "alimentacion", label: "Alimentación" },
                      { value: "social", label: "Social" }
                    ].map((option) => (
                      <label key={option.value} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={eventFilters.category === option.value}
                          onChange={() => onEventFilterChange('category', option.value)}
                          className="rounded border-border"
                        />
                        <span className="text-sm text-foreground">{option.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-3 block">
                    Precio
                  </label>
                  <div className="space-y-2">
                    {[
                      { value: "all", label: "Todos los precios" },
                      { value: "free", label: "Gratuitos" },
                      { value: "paid", label: "Con costo" }
                    ].map((option) => (
                      <label key={option.value} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={eventFilters.price === option.value}
                          onChange={() => onEventFilterChange('price', option.value)}
                          className="rounded border-border"
                        />
                        <span className="text-sm text-foreground">{option.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-3 block">
                    Fecha
                  </label>
                  <div className="space-y-2">
                    {[
                      { value: "all", label: "Todas las fechas" },
                      { value: "today", label: "Hoy" },
                      { value: "tomorrow", label: "Mañana" },
                      { value: "week", label: "Esta semana" },
                      { value: "month", label: "Este mes" }
                    ].map((option) => (
                      <label key={option.value} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={eventFilters.date === option.value}
                          onChange={() => onEventFilterChange('date', option.value)}
                          className="rounded border-border"
                        />
                        <span className="text-sm text-foreground">{option.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </form>
      </div>
    </>
  );
};
