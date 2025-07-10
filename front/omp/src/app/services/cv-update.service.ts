import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';
import { CvDto } from '../models/cv.interface';

@Injectable({
  providedIn: 'root'
})
export class CvUpdateService {
  // Private subject to emit CV updates
  private cvUpdateSubject = new Subject<string>();
  private cvDataSubject = new Subject<CvDto>();

  // Observable that components can subscribe to
  public cvUpdated$: Observable<string> = this.cvUpdateSubject.asObservable();
  public cvData$: Observable<CvDto> = this.cvDataSubject.asObservable();

  constructor() { }

  // Method to notify subscribers that a specific CV has been updated
  notifyCvUpdated(cvId: string): void {
    this.cvUpdateSubject.next(cvId);
  }

  // Method to share actual CV data with subscribers
  shareCvData(cv: CvDto): void {
    this.cvDataSubject.next(cv);
  }
}