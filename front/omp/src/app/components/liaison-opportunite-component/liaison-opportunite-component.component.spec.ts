import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LiaisonOpportuniteComponentComponent } from './liaison-opportunite-component.component';

describe('LiaisonOpportuniteComponentComponent', () => {
  let component: LiaisonOpportuniteComponentComponent;
  let fixture: ComponentFixture<LiaisonOpportuniteComponentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LiaisonOpportuniteComponentComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LiaisonOpportuniteComponentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
