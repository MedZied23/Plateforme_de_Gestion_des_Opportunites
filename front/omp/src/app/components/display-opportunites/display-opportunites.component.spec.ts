import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DisplayOpportunitesComponent } from './display-opportunites.component';

describe('DisplayOpportunitesComponent', () => {
  let component: DisplayOpportunitesComponent;
  let fixture: ComponentFixture<DisplayOpportunitesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DisplayOpportunitesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DisplayOpportunitesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
