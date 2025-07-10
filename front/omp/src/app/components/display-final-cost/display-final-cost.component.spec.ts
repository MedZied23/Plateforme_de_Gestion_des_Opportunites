import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DisplayFinalCostComponent } from './display-final-cost.component';

describe('DisplayFinalCostComponent', () => {
  let component: DisplayFinalCostComponent;
  let fixture: ComponentFixture<DisplayFinalCostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DisplayFinalCostComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DisplayFinalCostComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
