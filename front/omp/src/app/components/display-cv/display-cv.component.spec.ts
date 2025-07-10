import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DisplayCvComponent } from './display-cv.component';

describe('DisplayCvComponent', () => {
  let component: DisplayCvComponent;
  let fixture: ComponentFixture<DisplayCvComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DisplayCvComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DisplayCvComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
