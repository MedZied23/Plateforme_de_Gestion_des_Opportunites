import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SearchReferencesComponent } from './search-references.component';

describe('SearchReferencesComponent', () => {
  let component: SearchReferencesComponent;
  let fixture: ComponentFixture<SearchReferencesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SearchReferencesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SearchReferencesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
