import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DisplayCvAuditLogComponent } from './display-cv-audit-log.component';

describe('DisplayCvAuditLogComponent', () => {
  let component: DisplayCvAuditLogComponent;
  let fixture: ComponentFixture<DisplayCvAuditLogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DisplayCvAuditLogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DisplayCvAuditLogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
