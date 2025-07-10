import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfigureSiegeTerrainComponent } from './configure-siege-terrain.component';

describe('ConfigureSiegeTerrainComponent', () => {
  let component: ConfigureSiegeTerrainComponent;
  let fixture: ComponentFixture<ConfigureSiegeTerrainComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfigureSiegeTerrainComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ConfigureSiegeTerrainComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
