import { Component, Input, OnInit, OnChanges, SimpleChanges, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReferenceDto } from '../../models/reference.interface';
import { ReferenceService } from '../../services/reference.service';
import { UserService, UserDto } from '../../services/user.service';
import { Subscription } from 'rxjs';
import { map } from 'rxjs/operators';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

@Component({
  selector: 'app-display-reference',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './display-reference.component.html',
  styleUrl: './display-reference.component.css'
})
export class DisplayReferenceComponent implements OnInit, OnChanges, OnDestroy {
  @Input() referenceId: string | null = null;
  @ViewChild('referenceContainer') referenceContainer!: ElementRef;

  reference: ReferenceDto | null = null;
  teamMembers: Array<{ user: UserDto; role: string }> = [];
  loading = false;
  error: string | null = null;

  private subscription: Subscription = new Subscription();

  constructor(
    private referenceService: ReferenceService,
    private userService: UserService
  ) { }

  // Helper method to get object keys for *ngFor
  objectKeys(obj: any): string[] {
    return obj ? Object.keys(obj) : [];
  }

  ngOnInit(): void {
    this.loadReferenceIfIdExists();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['referenceId']) {
      this.loadReferenceIfIdExists();
    }
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  // Public method to refresh the reference data
  refreshData(): void {
    this.loadReferenceIfIdExists();
  }

  // Helper method to format currency
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  }

  // Helper method to format date
  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  async generatePDF() {
    try {
      const referenceElement = this.referenceContainer.nativeElement;
      const totalWidth = referenceElement.scrollWidth;
      const totalHeight = referenceElement.scrollHeight;

      // Store original styles
      const originalBackground = referenceElement.style.background;
      const originalHeight = referenceElement.style.height;
      const originalOverflow = referenceElement.style.overflow;

      // Set temporary styles for capturing
      referenceElement.style.background = 'white';
      referenceElement.style.height = `${totalHeight}px`;
      referenceElement.style.overflow = 'visible';      const canvas = await html2canvas(referenceElement, {
        useCORS: true,
        logging: false,
        width: totalWidth,
        height: totalHeight,
        allowTaint: true
      });

      // Restore original styles
      referenceElement.style.background = originalBackground;
      referenceElement.style.height = originalHeight;
      referenceElement.style.overflow = originalOverflow;

      // Calculate dimensions for A4 with margins
      const margin = 15; // 15mm margins
      const imgWidth = 210 - (2 * margin); // A4 width minus margins
      const pageHeight = 297 - (2 * margin); // A4 height minus margins
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // Create PDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      let position = 0;

      // Define table selectors to avoid cutting
      const tableSelectors = ['table', '.table-container', '.grid-container'];

      // Function to check if a position would cut through a table
      const wouldCutTable = (yPos: number) => {
        const scaleFactor = canvas.width / imgWidth;
        const pixelPos = yPos * scaleFactor;
        const tolerance = 50; // pixels to check around the cut point

        return tableSelectors.some(selector => {
          const tables = referenceElement.querySelectorAll(selector);
          return Array.from(tables).some(table => {
            const rect = (table as HTMLElement).getBoundingClientRect();
            return pixelPos > rect.top && pixelPos < rect.bottom;
          });
        });
      };

      // Add pages as needed
      while (position < imgHeight) {
        if (position > 0) {
          pdf.addPage();
        }

        // Calculate the height to slice for current page
        let heightLeft = imgHeight - position;
        const maxSliceHeight = Math.min(pageHeight, heightLeft);

        // Find the best cut point
        let sliceHeight = maxSliceHeight;
        const scaleFactor = canvas.width / imgWidth;
        const pixelsPerMM = scaleFactor;

        // Try to find a good breaking point within the last 20mm of the page
        const searchRange = 20 * pixelsPerMM;
        if (heightLeft > pageHeight) {
          for (let i = 0; i < searchRange; i++) {
            const testHeight = maxSliceHeight - (i / pixelsPerMM);
            if (!wouldCutTable(position + testHeight)) {
              sliceHeight = testHeight;
              break;
            }
          }
        }

        // Create a new canvas for the current slice
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvas.width;
        tempCanvas.height = sliceHeight * scaleFactor;
        const ctx = tempCanvas.getContext('2d')!;

        // Draw the slice with proper positioning
        ctx.drawImage(
          canvas,
          0,
          position * scaleFactor,
          canvas.width,
          sliceHeight * scaleFactor,
          0,
          0,
          canvas.width,
          sliceHeight * scaleFactor
        );

        // Add the slice to PDF with margins
        const imgData = tempCanvas.toDataURL('image/jpeg', 1.0);
        pdf.addImage(imgData, 'JPEG', margin, margin, imgWidth, sliceHeight);

        position += sliceHeight;
      }

      // Download the PDF with a descriptive filename
      const fileName = this.reference ? 
        `Reference_${this.reference.client}_${this.reference.offre}.pdf` : 
        'Reference.pdf';
      pdf.save(fileName);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Une erreur est survenue lors de la génération du PDF.');
    }
  }

  private loadReferenceIfIdExists(): void {
    if (this.referenceId) {
      this.loading = true;
      this.error = null;

      this.referenceService.getReferenceById(this.referenceId).subscribe({
        next: (reference) => {
          this.reference = reference;
          this.loadTeamMembers();
          this.loading = false;
        },
        error: (error) => {
          this.error = `Error loading reference: ${error.message}`;
          this.loading = false;
          console.error('Error loading reference:', error);
        }
      });
    }
  }

  private loadTeamMembers(): void {
    this.teamMembers = [];
    if (this.reference?.equipe) {
      // Get all user IDs from the equipe
      const userIds = Object.keys(this.reference.equipe);
      
      // If no users to load, return early
      if (userIds.length === 0) return;
      
      // Fetch all users in one call
      this.userService.getUsers().pipe(
        map(users => users.filter(user => userIds.includes(user.id)))
      ).subscribe({
        next: (users) => {
          // Map users to team members with their roles from equipe
          this.teamMembers = users.map(user => ({
            user,
            role: this.reference!.equipe[user.id]
          }));
        },
        error: (error) => {
          console.error('Error loading team members:', error);
        }
      });
    }
  }
}
