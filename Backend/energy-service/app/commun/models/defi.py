from sqlalchemy import Column, String, Integer, ForeignKey, Float, Date, Boolean,Time
from sqlalchemy import Enum as SQLAEnum
from sqlalchemy.orm import relationship
from app.commun.models.models import Base
from enum import Enum as PythonEnum
class TypeCondition(PythonEnum):
    REDUCTION_POURCENTAGE = "reduction_pourcentage"
    LIMITE_ABSOLUE = "limite_absolue"
class Défi(Base):
    __tablename__ = "Défi"
    
    idDefi = Column(Integer, primary_key=True, index=True, autoincrement=True)
    titre = Column(String)
    points = Column(Integer)
    description = Column(String)
    condition = Column(String)
    cible = Column(String)
    active = Column(Boolean)
    mode_recurrence = Column(String)
    date_debut_base = Column(Date)  
    heure_debut = Column(Time)      
    heure_fin = Column(Time)       
    duree_jours = Column(Integer)
    type_condition = Column(SQLAEnum(TypeCondition, name="typecondition", create_constraint=True))
    valeur_cible = Column(Float)  
    periode_comparaison = Column(String) 
    
    
    recompenses = relationship("Récompense", back_populates="defi")
    alertes = relationship("Alertes", back_populates="defi")
    categories_associees = relationship(
        "DefiCategorieAppareil", 
        back_populates="defi",
        cascade="all, delete-orphan"
    )
    def get_condition_description(self):
        # Récupérer les noms des catégories associées
        categories = [assoc.categorie.nom for assoc in self.categories_associees] if self.categories_associees else []
        categories_str = ", ".join(f"'{c}'" for c in categories) if categories else "cible"
        
        if self.cible.lower() == "catégorie appareil":
            if self.type_condition == TypeCondition.REDUCTION_POURCENTAGE:
                return f"Les appareils des catégories {categories_str} doivent réduire leur consommation de {self.valeur_cible}% par rapport {self.periode_comparaison}"
            else:  
                return f"Les appareils des catégories {categories_str} ne doivent pas consommer plus de {self.valeur_cible}KWh"
        else:
            if self.type_condition == TypeCondition.REDUCTION_POURCENTAGE:
                return f"Réduire la consommation de {self.valeur_cible}% par rapport {self.periode_comparaison}"
            else:  
                return f"Ne pas dépasser {self.valeur_cible}KWh"
        
