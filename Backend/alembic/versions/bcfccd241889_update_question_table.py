"""update question table

Revision ID: bcfccd241889
Revises: b3ffebf60478
Create Date: 2025-03-27 23:18:17.913372

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'bcfccd241889'
down_revision: Union[str, None] = 'b3ffebf60478'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column('questions', sa.Column('categorie', sa.String(), nullable=True))
    # ### end Alembic commands ###


def downgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_column('questions', 'categorie')
    # ### end Alembic commands ###
