import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OfferOpportunityWindowComponent } from './offer-opportunity-window.component';

describe('OfferOpportunityWindowComponent', () => {
  let component: OfferOpportunityWindowComponent;
  let fixture: ComponentFixture<OfferOpportunityWindowComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OfferOpportunityWindowComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OfferOpportunityWindowComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
