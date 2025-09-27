
import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { X, Filter, RotateCcw } from 'lucide-react';

export interface FilterState {
  entranceExam: string;
  subject: string;
  priceRange: [number, number];
}

interface TutorFiltersProps {
  onFiltersChange: (filters: FilterState) => void;
  availableExams: string[];
  availableSubjects: string[];
  priceRange: [number, number];
}

export const TutorFilters = ({ 
  onFiltersChange, 
  availableExams, 
  availableSubjects,
  priceRange 
}: TutorFiltersProps) => {
  const [filters, setFilters] = useState<FilterState>({
    entranceExam: 'all',
    subject: 'all',
    priceRange: priceRange
  });

  // Local state for price inputs to allow proper typing
  const [minPriceInput, setMinPriceInput] = useState(priceRange[0].toString());
  const [maxPriceInput, setMaxPriceInput] = useState(priceRange[1].toString());

  const [isOpen, setIsOpen] = useState(false);

  // Only initialize price range on first load
  useEffect(() => {
    setFilters(prev => ({ ...prev, priceRange }));
    setMinPriceInput(priceRange[0].toString());
    setMaxPriceInput(priceRange[1].toString());
  }, []); // Empty dependency array - only runs once on mount

  const updateFilters = (newFilters: Partial<FilterState>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    onFiltersChange(updatedFilters);
  };

  const clearFilters = () => {
    const clearedFilters: FilterState = {
      entranceExam: 'all',
      subject: 'all',
      priceRange: priceRange
    };
    setFilters(clearedFilters);
    setMinPriceInput(priceRange[0].toString());
    setMaxPriceInput(priceRange[1].toString());
    onFiltersChange(clearedFilters);
  };

  const hasActiveFilters = filters.entranceExam !== 'all' || filters.subject !== 'all' || 
    (filters.priceRange[0] !== priceRange[0] || filters.priceRange[1] !== priceRange[1]);

  const activeFilterCount = [
    filters.entranceExam !== 'all',
    filters.subject !== 'all',
    filters.priceRange[0] !== priceRange[0] || filters.priceRange[1] !== priceRange[1]
  ].filter(Boolean).length;

  const handleMinPriceBlur = () => {
    const minValue = Number(minPriceInput);
    
    if (isNaN(minValue) || minValue < 0) {
      setMinPriceInput(filters.priceRange[0].toString());
      return;
    }
    
    // Ensure min doesn't exceed current max
    const clampedMin = Math.min(minValue, filters.priceRange[1]);
    const newRange: [number, number] = [clampedMin, filters.priceRange[1]];
    
    setMinPriceInput(clampedMin.toString());
    updateFilters({ priceRange: newRange });
  };

  const handleMaxPriceBlur = () => {
    const maxValue = Number(maxPriceInput);
    
    if (isNaN(maxValue) || maxValue < 0) {
      setMaxPriceInput(filters.priceRange[1].toString());
      return;
    }
    
    // Ensure max doesn't go below current min
    const clampedMax = Math.max(maxValue, filters.priceRange[0]);
    const newRange: [number, number] = [filters.priceRange[0], clampedMax];
    
    setMaxPriceInput(clampedMax.toString());
    updateFilters({ priceRange: newRange });
  };

  return (
    <div className="mb-8">
      {/* Filter Toggle Button */}
      <div className="flex justify-center mb-4">
        <Button
          variant="outline"
          onClick={() => setIsOpen(!isOpen)}
          className="relative"
        >
          <Filter className="h-4 w-4 mr-2" />
          Filter Tutors
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </div>

      {/* Filter Panel */}
      {isOpen && (
        <Card className="shadow-elegant animate-fade-in-up">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Entrance Exam Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Entrance Exam
                </label>
                <Select
                  value={filters.entranceExam}
                  onValueChange={(value) => updateFilters({ entranceExam: value })}
                >
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="All exams" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border border-border">
                    <SelectItem value="all">All exams</SelectItem>
                    {availableExams.map(exam => (
                      <SelectItem key={exam} value={exam}>
                        {exam.toUpperCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Subject Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Degree
                </label>
                <Select
                  value={filters.subject}
                  onValueChange={(value) => updateFilters({ subject: value })}
                >
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="All subjects" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border border-border">
                    <SelectItem value="all">All subjects</SelectItem>
                    {availableSubjects.map(subject => (
                      <SelectItem key={subject} value={subject}>
                        {subject}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Price Range Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Price Range (£/hour)
                </label>
                <div className="flex gap-2 items-center">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={minPriceInput}
                    onChange={(e) => setMinPriceInput(e.target.value)}
                    onBlur={handleMinPriceBlur}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.currentTarget.blur();
                      }
                    }}
                    min={priceRange[0]}
                    max={filters.priceRange[1]}
                    className="w-20"
                  />
                  <span className="text-muted-foreground">to</span>
                  <Input
                    type="number"
                    placeholder="Max"
                    value={maxPriceInput}
                    onChange={(e) => setMaxPriceInput(e.target.value)}
                    onBlur={handleMaxPriceBlur}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.currentTarget.blur();
                      }
                    }}
                    min={filters.priceRange[0]}
                    max={priceRange[1]}
                    className="w-20"
                  />
                </div>
              </div>
            </div>

            {/* Active Filters and Clear Button */}
            {hasActiveFilters && (
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
                <div className="flex flex-wrap gap-2">
                  {filters.entranceExam !== 'all' && (
                    <Badge variant="secondary" className="gap-1">
                      {filters.entranceExam.toUpperCase()}
                      <X 
                        className="h-3 w-3 cursor-pointer" 
                        onClick={() => updateFilters({ entranceExam: 'all' })}
                      />
                    </Badge>
                  )}
                  {filters.subject !== 'all' && (
                    <Badge variant="secondary" className="gap-1">
                      {filters.subject}
                      <X 
                        className="h-3 w-3 cursor-pointer" 
                        onClick={() => updateFilters({ subject: 'all' })}
                      />
                    </Badge>
                  )}
                  {(filters.priceRange[0] !== priceRange[0] || filters.priceRange[1] !== priceRange[1]) && (
                    <Badge variant="secondary" className="gap-1">
                      £{filters.priceRange[0]}-£{filters.priceRange[1]}
                      <X 
                        className="h-3 w-3 cursor-pointer" 
                        onClick={() => {
                          updateFilters({ priceRange: priceRange });
                          setMinPriceInput(priceRange[0].toString());
                          setMaxPriceInput(priceRange[1].toString());
                        }}
                      />
                    </Badge>
                  )}
                </div>
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Clear All
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
