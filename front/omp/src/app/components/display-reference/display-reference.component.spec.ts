import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DisplayReferenceComponent } from './display-reference.component';

describe('DisplayReferenceComponent', () => {
  let component: DisplayReferenceComponent;
  let fixture: ComponentFixture<DisplayReferenceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DisplayReferenceComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DisplayReferenceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
