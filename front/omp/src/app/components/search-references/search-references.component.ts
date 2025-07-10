import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { debounceTime } from 'rxjs/operators';
import { ReferenceDto } from '../../models/reference.interface';
import { ReferenceService } from '../../services/reference.service';
import { PaginatedResponse } from '../../models/pagination.interface';

interface SearchFilters {
  keywords?: string;
  useFuzzySearch?: boolean;
  minimumSimilarityScore?: number;
  offre?: string;
  country?: string;
  startDate?: string;
  endDate?: string;
  budgetMin?: number;
  budgetMax?: number;
  [key: string]: any;
}

@Component({
  selector: 'app-search-references',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './search-references.component.html',
  styleUrls: ['./search-references.component.css']
})
export class SearchReferencesComponent implements OnInit {
  references: ReferenceDto[] = [];
  currentPage: number = 1;
  pageSize: number = 6;
  totalPages: number = 0;
  totalItems: number = 0;
  loading: boolean = false;
  error: string | null = null;
  searchForm: FormGroup;
  showFilters: boolean = false;

  constructor(
    private referenceService: ReferenceService,
    private router: Router,
    private fb: FormBuilder
  ) {
    this.searchForm = this.fb.group({
      keywords: [''],
      useFuzzySearch: [true],
      offre: [''],
      country: [''],
      startDate: [''],
      endDate: [''],
      budgetMin: [''],
      budgetMax: ['']
    });
  }

  ngOnInit() {
    this.loadReferences();
    
    // Subscribe to form value changes with debounce time
    this.searchForm.valueChanges.pipe(
      debounceTime(500)
    ).subscribe(() => {
      this.currentPage = 1; // Reset to first page on new search
      this.loadReferences();
    });
  }

  hasActiveFilters(): boolean {
    const filters = this.searchForm.value;
    return Object.keys(filters).some(key => {
      if (key === 'useFuzzySearch') return false; // Don't count this as a filter
      if (key === 'keywords' && this.showFilters) return false; // Don't count keywords when filters are shown
      return filters[key] !== '' && filters[key] !== null;
    });
  }

  getActiveFiltersCount(): number {
    const filters = this.searchForm.value;
    return Object.keys(filters).reduce((count, key) => {
      if (key === 'useFuzzySearch') return count; // Don't count this as a filter
      if (key === 'keywords') return count; // Don't count keywords
      return filters[key] !== '' && filters[key] !== null ? count + 1 : count;
    }, 0);
  }

  clearFilters(): void {
    this.searchForm.patchValue({
      offre: '',
      country: '',
      startDate: '',
      endDate: '',
      budgetMin: '',
      budgetMax: ''
    });
  }

  toggleFilters(): void {
    this.showFilters = !this.showFilters;
  }
  loadReferences() {
    this.loading = true;
    const filters: SearchFilters = this.searchForm.value;

    // Clean up empty string values and count non-empty filters
    let activeFiltersCount = 0;
    Object.keys(filters).forEach(key => {
      if (filters[key] === '') {
        delete filters[key];
      } else if (key !== 'useFuzzySearch' && filters[key] !== null) {
        activeFiltersCount++;
      }
    });

    // If no filters are active (excluding useFuzzySearch), use the regular getReferences endpoint
    if (activeFiltersCount === 0) {
      this.referenceService.getReferences(this.currentPage, this.pageSize).subscribe({
        next: (response: PaginatedResponse<ReferenceDto>) => {
          this.references = response.items;
          this.totalPages = response.totalPages;
          this.totalItems = response.totalCount;
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading references:', error);
          this.error = 'Erreur lors du chargement des références. Veuillez réessayer.';
          this.loading = false;
        }
      });
      return;
    }

    // Convert dates to ISO format and adjust the query parameters
    const params = new URLSearchParams();
    
    if (filters.startDate) {
      params.append('dateDebutMin', new Date(filters.startDate).toISOString());
    }
    if (filters.endDate) {
      params.append('dateFinMax', new Date(filters.endDate).toISOString());
    }
    
    // Add other filters
    if (filters.keywords) params.append('keywords', filters.keywords);
    if (filters.useFuzzySearch) params.append('useFuzzySearch', filters.useFuzzySearch.toString());
    if (filters.offre) params.append('offre', filters.offre);
    if (filters.country) params.append('country', filters.country);
    if (filters.budgetMin) params.append('budgetMin', filters.budgetMin.toString());
    if (filters.budgetMax) params.append('budgetMax', filters.budgetMax.toString());
    
    // Always include minimumSimilarityScore with a fixed value of 70 when using search
    params.append('minimumSimilarityScore', '70');

    this.referenceService.searchReferences(params.toString(), this.currentPage, this.pageSize).subscribe({
      next: (response: PaginatedResponse<ReferenceDto>) => {
        this.references = response.items;
        this.totalPages = response.totalPages;
        this.totalItems = response.totalCount;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading references:', error);
        this.error = 'Erreur lors du chargement des références. Veuillez réessayer.';
        this.loading = false;
      }
    });
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages || page === this.currentPage) {
      return;
    }
    this.currentPage = page;
    this.loadReferences();
  }

  viewReference(id: string): void {
    this.router.navigate(['/layout/add-reference', id]);
  }

  deleteReference(event: Event, id: string): void {
    event.stopPropagation();
    event.preventDefault();
    if (confirm('Êtes-vous sûr de vouloir supprimer cette référence ?')) {
      this.referenceService.deleteReference(id).subscribe({
        next: () => {
          this.loadReferences();
        },
        error: (error) => {
          console.error('Error deleting reference:', error);
          this.error = 'Erreur lors de la suppression de la référence. Veuillez réessayer.';
        }
      });
    }
  }

  getPreviewText(text: string, maxLength: number = 100): string {
    if (!text) return 'Aucune description';
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  }

  createNewReference(): void {
    this.router.navigate(['/layout/nouveau-reference']);
  }
}
